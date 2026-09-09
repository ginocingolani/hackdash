"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DiamondAvatar } from "@/components/ui/DiamondAvatar";
import { cx } from "@/lib/cx";
import { apiFetch, useApiErrorMessage } from "@/components/project/clientApi";
import { Overlay } from "./Overlay";
import type { WallAdmin, WallDashboard } from "./types";

// Admin side panel: dashboard details, open/close, admin grants/revokes,
// CSV export and the type-the-domain delete flow. All writes go through the
// legacy /api/v2 contract; the panel reports plain state changes upward so
// the wall header stays in sync without a refetch.

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
  dashboard: WallDashboard;
  admins: WallAdmin[];
  onDashboardChange: (patch: Partial<WallDashboard>) => void;
  onAdminsChange: (admins: WallAdmin[]) => void;
}

export function AdminPanel({
  open,
  onClose,
  dashboard,
  admins,
  onDashboardChange,
  onAdminsChange,
}: AdminPanelProps) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common.actions");
  const errorMessage = useApiErrorMessage();
  const router = useRouter();

  // — Details form —
  const [title, setTitle] = useState(dashboard.title ?? "");
  const [description, setDescription] = useState(dashboard.description ?? "");
  const [link, setLink] = useState(dashboard.link ?? "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function saveDetails() {
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    const result = await apiFetch<{ title?: string; description?: string; link?: string }>(
      `/api/v2/dashboards/${dashboard.domain}`,
      { method: "PUT", body: JSON.stringify({ title, description, link }) },
    );
    setSaving(false);
    if (!result.ok) {
      setSaveError(errorMessage(result.code));
      return;
    }
    onDashboardChange({
      title: result.data.title ?? title,
      description: result.data.description ?? description,
      link: result.data.link ?? link,
    });
    setLink(result.data.link ?? link);
    setSaved(true);
  }

  // — Open / closed —
  const [toggling, setToggling] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  async function toggleOpen() {
    setToggling(true);
    setToggleError(null);
    const next = !dashboard.open;
    const result = await apiFetch(`/api/v2/dashboards/${dashboard.domain}`, {
      method: "PUT",
      body: JSON.stringify({ open: next }),
    });
    setToggling(false);
    if (!result.ok) {
      setToggleError(errorMessage(result.code));
      return;
    }
    onDashboardChange({ open: next });
  }

  // — Admin search / grant / revoke —
  const [adminQuery, setAdminQuery] = useState("");
  const [results, setResults] = useState<WallAdmin[]>([]);
  const [searching, setSearching] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any pending debounce on unmount.
  useEffect(
    () => () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    },
    [],
  );

  // Debounced user search (min 3 chars), driven by the input handler.
  function handleAdminQueryChange(value: string) {
    setAdminQuery(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const q = value.trim();
    if (q.length < 3) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      const result = await apiFetch<WallAdmin[]>(
        `/api/v2/users?q=${encodeURIComponent(q)}&limit=8`,
      );
      setSearching(false);
      if (result.ok) setResults(result.data);
    }, 300);
  }

  async function grantAdmin(user: WallAdmin) {
    setAdminError(null);
    const result = await apiFetch(
      `/api/v2/${dashboard.domain}/admins/${user._id}`,
      { method: "POST" },
    );
    if (!result.ok) {
      setAdminError(errorMessage(result.code));
      return;
    }
    onAdminsChange([...admins, user]);
    setAdminQuery("");
    setResults([]);
  }

  async function revokeAdmin(user: WallAdmin) {
    if (!window.confirm(t("admin.revokeConfirm", { name: user.name }))) return;
    setAdminError(null);
    const result = await apiFetch(
      `/api/v2/${dashboard.domain}/admins/${user._id}`,
      { method: "DELETE" },
    );
    if (!result.ok) {
      setAdminError(errorMessage(result.code));
      return;
    }
    onAdminsChange(admins.filter((a) => a._id !== user._id));
  }

  // — Delete —
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function deleteDashboard() {
    setDeleting(true);
    setDeleteError(null);
    const result = await apiFetch(`/api/v2/dashboards/${dashboard.domain}`, {
      method: "DELETE",
    });
    if (!result.ok) {
      setDeleting(false);
      const guard =
        result.code === "forbidden"
          ? t("delete.guards.onlyOwner")
          : result.code === "dashboard_has_projects"
            ? t("delete.guards.hasProjects")
            : result.code === "dashboard_has_admins"
              ? t("delete.guards.hasAdmins")
              : errorMessage(result.code);
      setDeleteError(guard);
      return;
    }
    router.push("/");
  }

  const visibleResults = results.filter(
    (user) => !admins.some((admin) => admin._id === user._id),
  );

  const fieldLabel = "text-sm font-medium text-ink";
  const textareaClasses =
    "w-full rounded-lg border border-line bg-raised px-3 py-2 text-sm text-ink transition-colors placeholder:text-muted hover:border-muted/60";

  return (
    <Overlay open={open} onClose={onClose} title={t("admin.tools")} kind="panel">
      <div className="flex flex-col gap-8">
        {/* Details */}
        <section className="flex flex-col gap-3">
          {/* TODO i18n: dashboard.admin.details */}
          <h3 className={fieldLabel}>Dashboard details</h3>
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSaved(false);
            }}
            placeholder={t("form.titlePlaceholder")}
            aria-label={t("form.titlePlaceholder")}
          />
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setSaved(false);
            }}
            rows={3}
            placeholder={t("form.descriptionPlaceholder")}
            aria-label={t("form.descriptionPlaceholder")}
            className={textareaClasses}
          />
          <Input
            value={link}
            onChange={(e) => {
              setLink(e.target.value);
              setSaved(false);
            }}
            placeholder={t("form.linkPlaceholder")}
            aria-label={t("form.linkPlaceholder")}
          />
          {saveError ? <p className="text-sm text-mp-crimson">{saveError}</p> : null}
          <div className="flex items-center gap-3">
            <Button onClick={saveDetails} disabled={saving} size="sm">
              {saving ? tc("saving") : tc("save")}
            </Button>
            {saved ? (
              <span aria-live="polite" className="text-sm text-muted">
                ✓
              </span>
            ) : null}
          </div>
        </section>

        {/* Open / closed */}
        <section className="flex flex-col gap-2">
          <h3 className={fieldLabel}>{t("admin.status.label")}</h3>
          <button
            type="button"
            role="switch"
            aria-checked={dashboard.open}
            onClick={toggleOpen}
            disabled={toggling}
            title={dashboard.open ? t("admin.status.openHint") : t("admin.status.closedHint")}
            className="flex w-fit items-center gap-2.5 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-muted/60 disabled:opacity-50"
          >
            <span
              aria-hidden="true"
              className={cx(
                "relative h-5 w-9 rounded-full transition-colors",
                dashboard.open ? "bg-action" : "bg-line",
              )}
            >
              <span
                className={cx(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-mp-white transition-[left]",
                  dashboard.open ? "left-[18px]" : "left-0.5",
                )}
              />
            </span>
            {dashboard.open ? t("admin.status.open") : t("admin.status.closed")}
          </button>
          <p className="text-xs text-muted">
            {dashboard.open ? t("admin.status.openHint") : t("admin.status.closedHint")}
          </p>
          {toggleError ? <p className="text-sm text-mp-crimson">{toggleError}</p> : null}
        </section>

        {/* Admins */}
        <section className="flex flex-col gap-3">
          <h3 className={fieldLabel}>{t("admin.addAdmins")}</h3>
          <ul className="flex flex-col gap-2">
            {admins.map((admin) => (
              <li key={admin._id} className="flex items-center gap-2.5">
                <DiamondAvatar name={admin.name} src={admin.picture} entity="user" size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{admin.name}</span>
                  {admin.username ? (
                    <span className="block truncate text-xs text-muted">@{admin.username}</span>
                  ) : null}
                </span>
                <button
                  type="button"
                  onClick={() => revokeAdmin(admin)}
                  disabled={admins.length <= 1}
                  className="rounded-md px-2 py-1 text-xs font-medium text-mp-crimson transition-colors hover:bg-mp-crimson/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t("admin.revoke")}
                </button>
              </li>
            ))}
          </ul>
          <div className="relative">
            <Input
              value={adminQuery}
              onChange={(e) => handleAdminQueryChange(e.target.value)}
              placeholder={t("admin.addAdminPlaceholder")}
              aria-label={t("admin.addAdmins")}
            />
            {adminQuery.trim().length >= 3 ? (
              <ul className="absolute inset-x-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-lg border border-line bg-raised py-1 shadow-lg">
                {visibleResults.map((user) => (
                  <li key={user._id}>
                    <button
                      type="button"
                      onClick={() => grantAdmin(user)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-line/40"
                    >
                      <DiamondAvatar name={user.name} src={user.picture} entity="user" size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-ink">
                          {user.name}
                        </span>
                        {user.username ? (
                          <span className="block truncate text-xs text-muted">
                            @{user.username}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                ))}
                {!searching && visibleResults.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-muted">
                    {/* TODO i18n: dashboard.admin.addAdminNoResults */}
                    No users found
                  </li>
                ) : null}
              </ul>
            ) : null}
          </div>
          <p className="text-xs text-muted">{t("admin.addAdminWarning")}</p>
          {adminError ? <p className="text-sm text-mp-crimson">{adminError}</p> : null}
        </section>

        {/* Export */}
        <section>
          <a
            href={`/api/v2/dashboards/${dashboard.domain}/csv`}
            className="text-sm font-medium text-project underline underline-offset-2 hover:text-action"
          >
            {t("csv.export")}
          </a>
        </section>

        {/* Delete */}
        <section className="flex flex-col gap-3 rounded-xl border border-mp-crimson/30 p-4">
          <h3 className="text-sm font-semibold text-mp-crimson">{t("delete.title")}</h3>
          <p className="text-sm text-muted">
            {t("delete.warning", { domain: dashboard.domain })}
          </p>
          <label className="flex flex-col gap-1.5 text-xs text-muted">
            {t("delete.typeToConfirm", { domain: dashboard.domain })}
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={t("delete.confirmPlaceholder")}
              autoComplete="off"
            />
          </label>
          {deleteError ? <p className="text-sm text-mp-crimson">{deleteError}</p> : null}
          <button
            type="button"
            onClick={deleteDashboard}
            disabled={confirmText !== dashboard.domain || deleting}
            className="h-9 w-fit rounded-lg bg-mp-crimson px-4 text-sm font-semibold text-mp-white transition-[filter] hover:brightness-95 disabled:pointer-events-none disabled:opacity-50"
          >
            {t("delete.confirmButton")}
          </button>
        </section>
      </div>
    </Overlay>
  );
}
