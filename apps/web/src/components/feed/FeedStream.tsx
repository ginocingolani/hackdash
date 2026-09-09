"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { DiamondAvatar } from "@/components/ui/DiamondAvatar";
import { timeAgo } from "@/lib/timeAgo";

// Live activity stream for the projector feed page. Connects an EventSource
// to the per-dashboard SSE endpoint (/api/v2/{domain}/feed, `event: post`)
// and prepends localized event lines. Dark by design — the page commits to
// the ink ground regardless of theme.

type FeedEventType =
  | "project_created"
  | "project_edited"
  | "project_removed"
  | "project_follow"
  | "project_unfollow"
  | "project_join"
  | "project_leave";

interface FeedEvent {
  type: FeedEventType;
  domain: string;
  projectId: string;
  projectTitle: string;
  user: { name: string; username?: string; picture?: string };
  at: string; // ISO (Date serialized over SSE)
}

interface FeedEntry extends FeedEvent {
  key: number;
}

type Connection = "connecting" | "live" | "reconnecting";

// feed.events.* message keys per activity type. `project_removed` has no
// catalog key yet (proposed in messages/TODO-embeds.md) → hardcoded English.
const EVENT_KEYS: Partial<Record<FeedEventType, string>> = {
  project_created: "events.projectCreated",
  project_edited: "events.projectEdited",
  project_join: "events.joined",
  project_leave: "events.left",
  project_follow: "events.followed",
  project_unfollow: "events.unfollowed",
};

const MAX_EVENTS = 100;

const DOT_STYLE: Record<Connection, string> = {
  live: "bg-mp-cyan motion-safe:animate-pulse",
  connecting: "bg-[#90aac0]",
  reconnecting: "bg-mp-orange motion-safe:animate-pulse",
};

export function FeedStream({ domain }: { domain: string }) {
  const t = useTranslations("feed");
  const locale = useLocale();
  const [events, setEvents] = useState<FeedEntry[]>([]);
  const [connection, setConnection] = useState<Connection>("connecting");
  const nextKey = useRef(0);

  useEffect(() => {
    const source = new EventSource(`/api/v2/${encodeURIComponent(domain)}/feed`);
    source.onopen = () => setConnection("live");
    // EventSource reconnects on its own (the endpoint sends retry: 5000).
    source.onerror = () => setConnection("reconnecting");
    source.addEventListener("post", (message: MessageEvent) => {
      try {
        const event = JSON.parse(message.data as string) as FeedEvent;
        const entry: FeedEntry = { ...event, key: nextKey.current++ };
        setEvents((prev) => [entry, ...prev].slice(0, MAX_EVENTS));
      } catch {
        // Malformed payloads are dropped silently.
      }
    });
    return () => source.close();
  }, [domain]);

  // Re-render every 30s so the relative timestamps stay honest.
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const line = (event: FeedEvent): string => {
    const key = EVENT_KEYS[event.type];
    if (key) return t(key, { name: event.user.name, project: event.projectTitle });
    // Missing catalog key (project_removed) — English fallback.
    return `${event.user.name} removed ${event.projectTitle}`;
  };

  return (
    <section aria-label={t("title")}>
      {/* Entry animation for new lines; the global reduced-motion rule and
          the motion-safe guard both neutralize it when requested. */}
      <style>{`@keyframes feed-enter{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}`}</style>

      <p className="flex items-center gap-2.5 text-sm text-[#90aac0]" role="status">
        <span
          aria-hidden="true"
          className={`h-2.5 w-2.5 shrink-0 rotate-45 rounded-[22%] ${DOT_STYLE[connection]}`}
        />
        {t(connection === "live" ? "live" : connection)}
      </p>

      {events.length === 0 ? (
        <p className="mt-10 text-lg text-[#90aac0]">{t("empty")}</p>
      ) : (
        <ol className="mt-6">
          {events.map((event) => (
            <li
              key={event.key}
              className="flex items-center gap-4 border-b border-[#1d4160] py-4 motion-safe:animate-[feed-enter_0.35s_ease-out]"
            >
              <DiamondAvatar
                name={event.user.name}
                src={event.user.picture}
                entity="user"
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="text-lg leading-snug text-[#e9f1f8] sm:text-xl">
                  <Link
                    href={`/projects/${event.projectId}`}
                    className="rounded-sm hover:underline"
                  >
                    {line(event)}
                  </Link>
                </p>
                <time dateTime={event.at} className="mt-0.5 block text-sm text-[#90aac0]">
                  {timeAgo(event.at, locale)}
                </time>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
