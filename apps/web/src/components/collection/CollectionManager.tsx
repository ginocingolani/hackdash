"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, SearchInput } from "@/components/ui/Input";
import { apiFetch, errorCode } from "./request";

// Owner-only panel on the collection page: inline title/description editing,
// dashboard search-and-add, and deletion — the collections write path that
// was dead in legacy (improvement plan item 35, bug #1).

interface DashboardHit {
  _id: string;
  domain?: string | null;
  title?: string | null;
  projectsCount?: number | null;
}

export function CollectionManager({
  cid,
  title,
  description,
  dashboardIds,
}: {
  cid: string;
  title: string;
  description: string;
  dashboardIds: string[];
}) {
  const router = useRouter();
  const t = useTranslations();
  const tErr = useTranslations("errors.api");
  const message = (code: string) => (tErr.has(code) ? tErr(code) : tErr("unknown"));

  // Edit title/description
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftDescription, setDraftDescription] = useState(description);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      await apiFetch(`/api/v2/collections/${cid}`, {
        method: "PUT",
        body: { title: draftTitle, description: draftDescription },
      });
      setSaved(true);
      router.refresh();
    } catch (error) {
      setSaveError(message(errorCode(error)));
    } finally {
      setSaving(false);
    }
  }

  // Dashboard search + add
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<DashboardHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const searchSeq = useRef(0);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cancel any in-flight debounce on unmount.
  useEffect(
    () => () => {
      searchSeq.current++;
      if (searchTimer.current) clearTimeout(searchTimer.current);
    },
    [],
  );

  // Debounced search, driven from the change handler (not an effect).
  function onQueryChange(value: string) {
    setQuery(value);
    const q = value.trim();
    const seq = ++searchSeq.current;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (q.length < 2) {
      setHits([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v2/dashboards?q=${encodeURIComponent(q)}&limit=8`);
        if (!res.ok) return;
        const data = (await res.json()) as DashboardHit[];
        if (searchSeq.current === seq) setHits(Array.isArray(data) ? data : []);
      } catch {
        // Network hiccup — keep previous results.
      } finally {
        if (searchSeq.current === seq) setSearching(false);
      }
    }, 250);
  }

  async function add(did: string) {
    setAddingId(did);
    setAddError(null);
    try {
      await apiFetch(`/api/v2/collections/${cid}/dashboards/${did}`, { method: "POST" });
      router.refresh();
    } catch (error) {
      setAddError(message(errorCode(error)));
    } finally {
      setAddingId(null);
    }
  }

  // Delete collection
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function destroy() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiFetch(`/api/v2/collections/${cid}`, { method: "DELETE" });
      router.push("/");
      router.refresh();
    } catch (error) {
      setDeleteError(message(errorCode(error)));
      setDeleting(false);
    }
  }

  const textareaClasses =
    "w-full rounded-lg border border-line bg-raised px-3 py-2 text-sm text-ink transition-colors placeholder:text-muted hover:border-muted/60";

  return (
    <Card flush className="mt-8">
      {/* Edit — proposed key collection.editTitle */}
      <form onSubmit={save} className="flex flex-col gap-3 p-4 sm:p-5">
        <h2 className="font-semibold text-ink">Edit collection</h2>
        <Input
          name="title"
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          placeholder={t("collection.titlePlaceholder")}
          required
          aria-label={t("collection.titlePlaceholder")}
        />
        <textarea
          name="description"
          value={draftDescription}
          onChange={(e) => setDraftDescription(e.target.value)}
          placeholder={t("collection.descriptionPlaceholder")}
          aria-label={t("collection.descriptionPlaceholder")}
          rows={2}
          className={textareaClasses}
        />
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? t("common.actions.saving") : t("common.actions.save")}
          </Button>
          {saved ? (
            /* Proposed key collection.saved */
            <p className="text-sm text-muted" role="status">
              Collection saved
            </p>
          ) : null}
          {saveError ? (
            <p className="text-sm text-action" role="alert">
              {saveError}
            </p>
          ) : null}
        </div>
      </form>

      {/* Add dashboards — proposed keys collection.manage.* */}
      <div className="border-t border-line p-4 sm:p-5">
        <h2 className="font-semibold text-ink">Add dashboards</h2>
        <SearchInput
          label="Search dashboards to add"
          placeholder="Search dashboards to add"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="mt-3 max-w-md"
        />
        {addError ? (
          <p className="mt-2 text-sm text-action" role="alert">
            {addError}
          </p>
        ) : null}
        {query.trim().length >= 2 ? (
          searching && hits.length === 0 ? (
            <p className="mt-3 text-sm text-muted">{t("common.state.loading")}</p>
          ) : hits.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              {t("landing.search.noResults", { query: query.trim() })}
            </p>
          ) : (
            <ul className="mt-2 max-w-md divide-y divide-line">
              {hits.map((hit) => {
                const inCollection = dashboardIds.includes(hit._id);
                return (
                  <li key={hit._id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-sm font-medium text-ink">
                        {hit.title || hit.domain}
                      </p>
                      <p className="text-xs font-medium text-project">/{hit.domain}</p>
                    </div>
                    {inCollection ? (
                      <span className="text-xs text-muted">Added</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => add(hit._id)}
                        disabled={addingId !== null}
                      >
                        {/* Proposed key common.actions.add */}
                        Add
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )
        ) : (
          <p className="mt-2 text-xs text-muted">
            {/* Proposed key collection.manage.hint */}
            Type at least two characters to search all dashboards.
          </p>
        )}
      </div>

      {/* Delete */}
      <div className="border-t border-line p-4 sm:p-5">
        <h2 className="font-semibold text-ink">{t("collection.delete.title")}</h2>
        {confirmingDelete ? (
          <div className="mt-3 flex flex-col gap-3">
            <p className="max-w-prose text-sm text-muted">{t("collection.delete.confirm")}</p>
            {deleteError ? (
              <p className="text-sm text-action" role="alert">
                {deleteError}
              </p>
            ) : null}
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setConfirmingDelete(false)}>
                {t("common.actions.cancel")}
              </Button>
              <Button size="sm" onClick={destroy} disabled={deleting}>
                {t("collection.delete.confirmButton")}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            className="mt-3 text-action"
            onClick={() => setConfirmingDelete(true)}
          >
            {t("common.actions.delete")}
          </Button>
        )}
      </div>
    </Card>
  );
}
