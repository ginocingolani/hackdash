"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { coverGradient } from "@/components/entities/coverFallback";
import { cx } from "@/lib/cx";
import { apiFetch, useApiErrorMessage } from "@/components/project/clientApi";
import type { WallProject } from "./types";

// "Demo order" mode: a sortable grid of every project with per-project
// visibility switches. Legacy contract: the saved `showcase` array holds the
// visible projects' ids in demo order — order is the array, visibility is
// presence in it.

interface ShowcaseEditorProps {
  domain: string;
  projects: WallProject[];
  showcase: string[];
  onSaved: (showcase: string[]) => void;
  onCancel: () => void;
}

function SortableTile({
  project,
  visible,
  onToggle,
  visibleLabel,
  hiddenLabel,
}: {
  project: WallProject;
  visible: boolean;
  onToggle: () => void;
  visibleLabel: string;
  hiddenLabel: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: project._id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cx(
        "flex items-center gap-3 overflow-hidden rounded-xl border bg-raised p-2 pr-3",
        isDragging ? "z-10 border-action shadow-lg" : "border-line",
        !visible && "opacity-60",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={project.title}
        className="flex h-8 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted transition-colors hover:bg-line/50 hover:text-ink active:cursor-grabbing"
      >
        <svg aria-hidden="true" viewBox="0 0 12 16" className="h-4 w-3">
          <g fill="currentColor">
            <circle cx="3.5" cy="3" r="1.4" />
            <circle cx="8.5" cy="3" r="1.4" />
            <circle cx="3.5" cy="8" r="1.4" />
            <circle cx="8.5" cy="8" r="1.4" />
            <circle cx="3.5" cy="13" r="1.4" />
            <circle cx="8.5" cy="13" r="1.4" />
          </g>
        </svg>
      </button>
      <span
        aria-hidden="true"
        className="h-10 w-14 shrink-0 overflow-hidden rounded-md"
        style={project.cover ? undefined : { background: coverGradient(project.title) }}
      >
        {project.cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary legacy hosts
          <img src={project.cover} alt="" className="h-full w-full object-cover" />
        ) : null}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
        {project.title}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={visible}
        aria-label={visible ? visibleLabel : hiddenLabel}
        title={visible ? visibleLabel : hiddenLabel}
        onClick={onToggle}
        className={cx(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          visible ? "bg-action" : "bg-line",
        )}
      >
        <span
          aria-hidden="true"
          className={cx(
            "absolute top-0.5 h-4 w-4 rounded-full bg-mp-white transition-[left]",
            visible ? "left-[18px]" : "left-0.5",
          )}
        />
      </button>
    </li>
  );
}

export function ShowcaseEditor({
  domain,
  projects,
  showcase,
  onSaved,
  onCancel,
}: ShowcaseEditorProps) {
  const t = useTranslations("dashboard.showcase");
  const tc = useTranslations("common.actions");
  const errorMessage = useApiErrorMessage();

  const byId = useMemo(() => new Map(projects.map((p) => [p._id, p])), [projects]);

  // Showcase members first (in demo order), everything else after.
  const [order, setOrder] = useState<string[]>(() => {
    const inShowcase = showcase.filter((id) => byId.has(id));
    const rest = projects.map((p) => p._id).filter((id) => !inShowcase.includes(id));
    return [...inShowcase, ...rest];
  });
  const [visible, setVisible] = useState<Set<string>>(
    () => new Set(showcase.filter((id) => byId.has(id))),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrder((current) =>
      arrayMove(current, current.indexOf(String(active.id)), current.indexOf(String(over.id))),
    );
  }

  function toggle(id: string) {
    setVisible((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    const next = order.filter((id) => visible.has(id));
    const result = await apiFetch(`/api/v2/dashboards/${domain}`, {
      method: "PUT",
      body: JSON.stringify({ showcase: next }),
    });
    setSaving(false);
    if (!result.ok) {
      setError(errorMessage(result.code));
      return;
    }
    onSaved(next);
  }

  return (
    <section aria-label={t("label")} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{t("reorderHint")}</p>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={saving}>
            {tc("cancel")}
          </Button>
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? tc("saving") : t("save")}
          </Button>
        </div>
      </div>
      {error ? <p className="text-sm text-mp-crimson">{error}</p> : null}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={rectSortingStrategy}>
          <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {order.map((id) => {
              const project = byId.get(id);
              if (!project) return null;
              return (
                <SortableTile
                  key={id}
                  project={project}
                  visible={visible.has(id)}
                  onToggle={() => toggle(id)}
                  visibleLabel={t("visible")}
                  hiddenLabel={t("hidden")}
                />
              );
            })}
          </ol>
        </SortableContext>
      </DndContext>
    </section>
  );
}
