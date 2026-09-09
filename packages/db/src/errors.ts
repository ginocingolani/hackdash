// Service-layer errors. `code` values preserve the legacy API error strings
// (docs/legacy/server.md §3) so clients can keep matching on them; `status`
// is the proper HTTP status the route layer should send.
export type ServiceErrorCode =
  | "not_authenticated"
  | "forbidden"
  | "not_found"
  | "subdomain_invalid"
  | "subdomain_inuse"
  | "title_required"
  | "description_required"
  | "email_invalid"
  | "name_required"
  | "email_required"
  | "dashboard_closed"
  | "dashboard_has_projects"
  | "dashboard_has_admins"
  | "last_admin"
  | "leader_cannot_leave"
  | "validation_failed";

export class ServiceError extends Error {
  constructor(
    public readonly code: ServiceErrorCode,
    public readonly status: number,
    message?: string
  ) {
    super(message ?? code);
    this.name = "ServiceError";
  }
}

export const notFound = () => new ServiceError("not_found", 404);
export const forbidden = () => new ServiceError("forbidden", 403);
export const unauthenticated = () => new ServiceError("not_authenticated", 401);
