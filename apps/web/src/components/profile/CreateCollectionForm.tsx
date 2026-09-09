"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiFetch, errorCode } from "@/components/collection/request";

// Create collection from the profile — the entry point of the restored
// collections write path (improvement plan item 35). On success the new
// collection appears in the Collections tab and a direct link is offered.

export function CreateCollectionForm() {
  const router = useRouter();
  const t = useTranslations();
  const tErr = useTranslations("errors.api");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function create(event: FormEvent) {
    event.preventDefault();
    setCreating(true);
    setCreatedId(null);
    setError(null);
    try {
      const created = await apiFetch<{ _id?: string }>("/api/v2/collections", {
        method: "POST",
        body: { title, description },
      });
      setCreatedId(created?._id ?? null);
      setTitle("");
      setDescription("");
      router.refresh();
    } catch (err) {
      const code = errorCode(err);
      setError(tErr.has(code) ? tErr(code) : tErr("unknown"));
    } finally {
      setCreating(false);
    }
  }

  return (
    <Card>
      <form onSubmit={create} className="flex h-full flex-col gap-3">
        <div>
          <h2 className="font-semibold text-ink">{t("collection.create")}</h2>
          <p className="text-xs text-muted">
            {/* Proposed key collection.createHint */}
            One URL for all your events — Media Party 2013 to today.
          </p>
        </div>
        <Input
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("collection.titlePlaceholder")}
          aria-label={t("collection.titlePlaceholder")}
          required
        />
        <textarea
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("collection.descriptionPlaceholder")}
          aria-label={t("collection.descriptionPlaceholder")}
          rows={3}
          className="w-full rounded-lg border border-line bg-raised px-3 py-2 text-sm text-ink transition-colors placeholder:text-muted hover:border-muted/60"
        />
        <div className="mt-auto flex flex-wrap items-center gap-3 pt-1">
          <Button type="submit" size="sm" variant="secondary" disabled={creating}>
            {t("common.actions.create")}
          </Button>
          {createdId ? (
            <Link
              href={`/collections/${createdId}`}
              className="text-sm font-medium text-ink underline"
              role="status"
            >
              {t("collection.view")}
            </Link>
          ) : null}
          {error ? (
            <p className="text-sm font-medium text-action" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
