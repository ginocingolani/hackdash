import { EventEmitter } from "node:events";

// Activity bus reproducing the legacy event vocabulary
// (docs/legacy/server.md §5), plus `project_removed`, which the legacy
// client handled but the server never emitted. Payload users are already
// stripped to public fields — never put emails here (legacy bug #10).
export type ActivityEventType =
  | "project_created"
  | "project_edited"
  | "project_removed"
  | "project_follow"
  | "project_unfollow"
  | "project_join"
  | "project_leave";

export interface ActivityEvent {
  type: ActivityEventType;
  domain: string;
  projectId: string;
  projectTitle: string;
  user: { _id: string; name: string; username: string; picture?: string };
  at: Date;
}

class ActivityBus extends EventEmitter {
  emitActivity(event: ActivityEvent): void {
    this.emit("activity", event);
  }
  onActivity(listener: (event: ActivityEvent) => void): () => void {
    this.on("activity", listener);
    return () => this.off("activity", listener);
  }
}

export const activityBus = new ActivityBus();
