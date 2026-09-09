"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Overlay } from "@/components/dashboard/Overlay";
import { apiFetch, useApiErrorMessage } from "./clientApi";

// The project page's primary actions, swapping by relationship:
//   leader     → Edit (+ Delete)
//   contributor→ Leave + Follow/Unfollow
//   visitor    → Join + Follow (login-gated)
// Membership writes are optimistic: flip first, revert on failure.

interface MembershipActionsProps {
  pid: string;
  domain: string | null;
  isLoggedIn: boolean;
  isLeader: boolean;
  /** Leader or dashboard admin (server-checked). */
  canEdit: boolean;
  initialContributor: boolean;
  initialFollower: boolean;
}

export function MembershipActions({
  pid,
  domain,
  isLoggedIn,
  isLeader,
  canEdit,
  initialContributor,
  initialFollower,
}: MembershipActionsProps) {
  const t = useTranslations("project");
  const tc = useTranslations("common.actions");
  const errorMessage = useApiErrorMessage();
  const router = useRouter();

  const [contributor, setContributor] = useState(initialContributor);
  const [follower, setFollower] = useState(initialFollower);
  const [busy, setBusy] = useState<"contributors" | "followers" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const editHref = `/projects/${pid}/edit`;
  const signinHref = `/api/auth/signin?callbackUrl=${encodeURIComponent(`/projects/${pid}`)}`;

  async function toggleMembership(field: "contributors" | "followers") {
    const current = field === "contributors" ? contributor : follower;
    const setter = field === "contributors" ? setContributor : setFollower;
    setter(!current); // optimistic
    setBusy(field);
    setError(null);
    const result = await apiFetch(`/api/v2/projects/${pid}/${field}`, {
      method: current ? "DELETE" : "POST",
    });
    setBusy(null);
    if (!result.ok) {
      setter(current); // revert
      setError(errorMessage(result.code));
      return;
    }
    router.refresh();
  }

  async function deleteProject() {
    setDeleting(true);
    setDeleteError(null);
    const result = await apiFetch(`/api/v2/projects/${pid}`, { method: "DELETE" });
    if (!result.ok) {
      setDeleting(false);
      setDeleteError(errorMessage(result.code));
      return;
    }
    router.push(domain ? `/dashboards/${domain}` : "/");
  }

  const joinLabel =
    busy === "contributors"
      ? contributor
        ? t("card.joining")
        : t("card.leaving")
      : contributor
        ? t("card.leave")
        : t("card.join");
  const followLabel =
    busy === "followers"
      ? follower
        ? t("card.following")
        : t("card.unfollowing")
      : follower
        ? t("card.unfollow")
        : t("card.follow");

  return (
    <div className="flex flex-col gap-3">
      {isLeader ? (
        <Button href={editHref} className="w-full">
          {t("detail.edit")}
        </Button>
      ) : isLoggedIn ? (
        <div className="flex gap-2">
          <Button
            onClick={() => toggleMembership("contributors")}
            disabled={busy !== null}
            variant={contributor ? "secondary" : "primary"}
            className="flex-1"
          >
            {joinLabel}
          </Button>
          <Button
            onClick={() => toggleMembership("followers")}
            disabled={busy !== null}
            variant="secondary"
            className="flex-1"
          >
            {followLabel}
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button href={signinHref} className="flex-1">
            {t("card.join")}
          </Button>
          <Button href={signinHref} variant="secondary" className="flex-1">
            {t("card.follow")}
          </Button>
        </div>
      )}

      {error ? <p className="text-sm text-mp-crimson">{error}</p> : null}

      {canEdit ? (
        <div className="flex items-center gap-2">
          {!isLeader ? (
            <Button href={editHref} variant="secondary" size="sm" className="flex-1">
              {t("detail.edit")}
            </Button>
          ) : null}
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="h-8 flex-1 rounded-lg border border-mp-crimson/40 px-3 text-sm font-medium text-mp-crimson transition-colors hover:bg-mp-crimson/10"
          >
            {t("delete.title")}
          </button>
        </div>
      ) : null}

      <Overlay open={deleteOpen} onClose={() => setDeleteOpen(false)} title={t("delete.title")}>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink">{t("delete.confirm")}</p>
          {deleteError ? <p className="text-sm text-mp-crimson">{deleteError}</p> : null}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              {tc("cancel")}
            </Button>
            <button
              type="button"
              onClick={deleteProject}
              disabled={deleting}
              className="h-10 rounded-lg bg-mp-crimson px-4 text-sm font-semibold text-mp-white transition-[filter] hover:brightness-95 disabled:pointer-events-none disabled:opacity-50"
            >
              {t("delete.confirmButton")}
            </button>
          </div>
        </div>
      </Overlay>
    </div>
  );
}
