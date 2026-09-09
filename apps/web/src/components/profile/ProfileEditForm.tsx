"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiFetch, errorCode } from "@/components/collection/request";

// Own-profile edit form: name + email required (validated server-side too:
// name_required / email_required / email_invalid), optional bio.
// PUT /api/v2/profiles/:uid — legacy bug #9 is fixed in the service.

export function ProfileEditForm({
  uid,
  name,
  email,
  bio,
}: {
  uid: string;
  name: string;
  email: string;
  bio: string;
}) {
  const router = useRouter();
  const t = useTranslations();
  const tErr = useTranslations("errors.api");
  const [draftName, setDraftName] = useState(name);
  const [draftEmail, setDraftEmail] = useState(email);
  const [draftBio, setDraftBio] = useState(bio);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await apiFetch(`/api/v2/profiles/${uid}`, {
        method: "PUT",
        body: { name: draftName, email: draftEmail, bio: draftBio },
      });
      setSaved(true);
      router.refresh();
    } catch (err) {
      const code = errorCode(err);
      setError(tErr.has(code) ? tErr(code) : tErr("unknown"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <form onSubmit={save} className="flex h-full flex-col gap-3">
        <div>
          <h2 className="font-semibold text-ink">{t("profile.edit.title")}</h2>
          <p className="text-xs text-muted">{t("profile.edit.allFieldsRequired")}</p>
        </div>
        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          {/* Proposed key profile.edit.nameLabel */}
          Name
          <Input
            name="name"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            required
            autoComplete="name"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          {t("auth.email.label")}
          <Input
            name="email"
            type="email"
            value={draftEmail}
            onChange={(e) => setDraftEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <span className="text-xs font-normal text-muted">
            {t("profile.edit.emailPrivacy")}
          </span>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          {t("profile.edit.aboutYou")}
          <textarea
            name="bio"
            value={draftBio}
            onChange={(e) => setDraftBio(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-line bg-raised px-3 py-2 text-sm font-normal text-ink transition-colors placeholder:text-muted hover:border-muted/60"
          />
        </label>
        <div className="mt-auto flex flex-wrap items-center gap-3 pt-1">
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? t("common.actions.saving") : t("profile.edit.save")}
          </Button>
          {saved ? (
            <p className="text-sm text-muted" role="status">
              {t("profile.edit.saved")}
            </p>
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
