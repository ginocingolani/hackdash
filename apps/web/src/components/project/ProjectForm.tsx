"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ProjectStatus } from "@hackdash/db";
import { PROJECT_STATUSES } from "@hackdash/db";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { coverGradient } from "@/components/entities/coverFallback";
import { cx } from "@/lib/cx";
import type { StatusLabels } from "@/components/dashboard/types";
import { apiFetch, useApiErrorMessage } from "./clientApi";
import { StatusPicker } from "./StatusPicker";

// One form for both project screens. Create (screen 4): two required fields,
// optional GitHub import, submit in one tap. Edit: same form prefilled, with
// the status as a tappable segmented control (StatusPicker) for the team.

export interface ProjectFormValues {
  title: string;
  description: string;
  link: string;
  status: ProjectStatus;
  tags: string[];
  cover: string | null;
}

const EMPTY: ProjectFormValues = {
  title: "",
  description: "",
  link: "",
  status: PROJECT_STATUSES[0],
  tags: [],
  cover: null,
};

const COVER_MAX_BYTES = 5 * 1024 * 1024;
const COVER_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

type ProjectFormProps =
  | { mode: "create"; domain: string; pid?: undefined; initial?: undefined; statusLabels: StatusLabels }
  | { mode: "edit"; domain?: undefined; pid: string; initial: ProjectFormValues; statusLabels: StatusLabels };

export function ProjectForm(props: ProjectFormProps) {
  const { mode, statusLabels } = props;
  const t = useTranslations("project.form");
  const tc = useTranslations("common");
  const errorMessage = useApiErrorMessage();
  const router = useRouter();

  const [values, setValues] = useState<ProjectFormValues>(
    mode === "edit" ? props.initial : EMPTY,
  );
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; description?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  // — GitHub import —
  const [repo, setRepo] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  async function importFromGitHub() {
    const match = repo.trim().match(/^([\w.-]+)\/([\w.-]+)$/);
    if (!match) {
      setImportError(t("github.failed"));
      return;
    }
    setImporting(true);
    setImportError(null);
    try {
      const res = await fetch(`https://api.github.com/repos/${match[1]}/${match[2]}`);
      if (!res.ok) throw new Error("not ok");
      const data = (await res.json()) as {
        name?: string;
        description?: string | null;
        homepage?: string | null;
        html_url?: string;
        language?: string | null;
      };
      setValues((v) => ({
        ...v,
        title: data.name ?? v.title,
        description: data.description ?? v.description,
        link: data.homepage || data.html_url || v.link,
        status: "building",
        tags:
          data.language && !v.tags.includes(data.language.toLowerCase())
            ? [...v.tags, data.language.toLowerCase()]
            : v.tags,
      }));
    } catch {
      setImportError(t("github.failed"));
    } finally {
      setImporting(false);
    }
  }

  // — Tags —
  const [tagDraft, setTagDraft] = useState("");

  function commitTag() {
    const tag = tagDraft.trim().replace(/,+$/, "").toLowerCase();
    if (tag && !values.tags.includes(tag)) set("tags", [...values.tags, tag]);
    setTagDraft("");
  }

  // — Cover upload —
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);

  async function uploadCover(file: File) {
    if (!COVER_TYPES.has(file.type)) {
      setCoverError(t("cover.invalidType"));
      return;
    }
    if (file.size > COVER_MAX_BYTES) {
      setCoverError(t("cover.tooBig", { max: "5 MB" }));
      return;
    }
    setCoverError(null);
    setUploading(true);
    const form = new FormData();
    form.append("cover", file);
    const result = await apiFetch<{ href: string }>("/api/v2/projects/cover", {
      method: "POST",
      body: form,
    });
    setUploading(false);
    if (!result.ok) {
      setCoverError(
        result.code === "file-too-large"
          ? t("cover.tooBig", { max: "5 MB" })
          : result.code === "image-mimetype-expected"
            ? t("cover.invalidType")
            : errorMessage(result.code),
      );
      return;
    }
    set("cover", result.data.href);
  }

  // — Submit —
  async function submit() {
    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});
    // Empty strings are sent on purpose: the service clears link/cover when
    // the field arrives empty, and skips fields that arrive undefined.
    const body = {
      title: values.title,
      description: values.description,
      link: values.link,
      status: values.status,
      tags: values.tags,
      cover: values.cover ?? "",
    };
    const result =
      mode === "create"
        ? await apiFetch<{ _id: string }>("/api/v2/projects", {
            method: "POST",
            body: JSON.stringify({ ...body, domain: props.domain }),
          })
        : await apiFetch<{ _id: string }>(`/api/v2/projects/${props.pid}`, {
            method: "PUT",
            body: JSON.stringify(body),
          });
    if (!result.ok) {
      setSubmitting(false);
      const message = errorMessage(result.code);
      if (result.code === "title_required") setFieldErrors({ title: message });
      else if (result.code === "description_required") setFieldErrors({ description: message });
      else setFormError(message);
      return;
    }
    const pid = mode === "create" ? result.data._id : props.pid;
    router.push(`/projects/${pid}`);
    router.refresh();
  }

  const fieldLabel = "flex flex-col gap-1.5 text-sm font-medium text-ink";
  const hint = "text-xs font-normal text-muted";

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      {/* GitHub import */}
      <div className="rounded-xl border border-line bg-raised p-4">
        <p className="text-sm font-medium text-ink">
          {t("github.importProject")} · {t("github.provider")}
        </p>
        <div className="mt-2 flex gap-2">
          <Input
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder={t("github.repoPlaceholder")}
            aria-label={t("github.provider")}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={importFromGitHub}
            disabled={importing || !repo.trim()}
          >
            {importing ? t("github.importing") : t("github.import")}
          </Button>
        </div>
        {importError ? <p className="mt-2 text-sm text-mp-crimson">{importError}</p> : null}
      </div>

      <label className={fieldLabel}>
        {t("titleLabel")}
        <Input
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder={t("titlePlaceholder")}
          required
          aria-invalid={!!fieldErrors.title}
        />
        {fieldErrors.title ? (
          <span className="text-xs font-normal text-mp-crimson">{fieldErrors.title}</span>
        ) : null}
      </label>

      <label className={fieldLabel}>
        {t("descriptionLabel")}
        <textarea
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          rows={8}
          required
          aria-invalid={!!fieldErrors.description}
          className="w-full rounded-lg border border-line bg-raised px-3 py-2 text-sm text-ink transition-colors placeholder:text-muted hover:border-muted/60"
        />
        <span className={hint}>{t("descriptionHint")}</span>
        {fieldErrors.description ? (
          <span className="text-xs font-normal text-mp-crimson">{fieldErrors.description}</span>
        ) : null}
      </label>

      <label className={fieldLabel}>
        {t("demoUrlLabel")}
        <Input
          value={values.link}
          onChange={(e) => set("link", e.target.value)}
          type="url"
          placeholder="https://"
        />
      </label>

      {/* Tags */}
      <div className={fieldLabel}>
        <label htmlFor="project-tags">{t("tagsLabel")}</label>
        {values.tags.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {values.tags.map((tag) => (
              <li
                key={tag}
                className="inline-flex items-center gap-1 rounded-full border border-line bg-raised px-2.5 py-0.5 text-xs font-medium text-ink"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => set("tags", values.tags.filter((existing) => existing !== tag))}
                  /* TODO i18n: project.form.tagsRemove */
                  aria-label={`Remove tag ${tag}`}
                  className="text-muted transition-colors hover:text-mp-crimson"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <Input
          id="project-tags"
          value={tagDraft}
          onChange={(e) => {
            const draft = e.target.value;
            if (draft.endsWith(",")) {
              const tag = draft.slice(0, -1).trim().toLowerCase();
              if (tag && !values.tags.includes(tag)) set("tags", [...values.tags, tag]);
              setTagDraft("");
            } else {
              setTagDraft(draft);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitTag();
            } else if (e.key === "Backspace" && !tagDraft && values.tags.length > 0) {
              set("tags", values.tags.slice(0, -1));
            }
          }}
          onBlur={commitTag}
          placeholder={t("tagsHint")}
        />
      </div>

      {/* Status */}
      {mode === "edit" ? (
        <StatusPicker
          value={values.status}
          onChange={(status) => set("status", status)}
          labels={statusLabels}
          legend={tc("status.label")}
        />
      ) : (
        <label className={fieldLabel}>
          {tc("status.label")}
          <select
            value={values.status}
            onChange={(e) => set("status", e.target.value as ProjectStatus)}
            className="h-10 w-full rounded-lg border border-line bg-raised px-3 text-sm text-ink transition-colors hover:border-muted/60"
          >
            {PROJECT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </label>
      )}

      {/* Cover */}
      <div className={fieldLabel}>
        <span>{t("cover.label")}</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadCover(file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={cx(
            "relative flex h-36 w-full max-w-sm items-center justify-center overflow-hidden rounded-xl border border-dashed border-line text-sm font-medium transition-colors hover:border-muted/60",
            values.cover ? "text-mp-white" : "text-muted",
          )}
          style={
            values.cover
              ? undefined
              : { background: coverGradient(values.title || "hackdash") }
          }
        >
          {values.cover ? (
            // eslint-disable-next-line @next/next/no-img-element -- uploaded/legacy hosts
            <img
              src={values.cover}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : null}
          <span className="relative rounded-md bg-mp-ink/70 px-3 py-1 text-mp-white">
            {uploading
              ? /* TODO i18n: project.form.cover.uploading */ "Uploading…"
              : t("cover.drop")}
          </span>
        </button>
        {values.cover ? (
          <button
            type="button"
            onClick={() => set("cover", null)}
            className="w-fit text-xs font-normal text-muted underline underline-offset-2 hover:text-mp-crimson"
          >
            {tc("actions.remove")}
          </button>
        ) : null}
        {coverError ? (
          <span className="text-xs font-normal text-mp-crimson">{coverError}</span>
        ) : null}
      </div>

      {formError ? <p className="text-sm text-mp-crimson">{formError}</p> : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting
            ? tc("actions.saving")
            : mode === "create"
              ? tc("actions.create")
              : tc("actions.save")}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          {tc("actions.cancel")}
        </Button>
      </div>
    </form>
  );
}
