// @hackdash/db — shared data layer for the HackDash rewrite.
// Schemas are ported field-for-field from the legacy Mongoose models
// (docs/legacy/server.md §2); services carry the legacy business logic with
// the documented bugs fixed (docs/legacy/server.md §9).

export { connectDb } from "./connect";
export { PROJECT_STATUSES, type ProjectStatus } from "./statuses";
export { ServiceError, type ServiceErrorCode } from "./errors";
export { activityBus, type ActivityEvent, type ActivityEventType } from "./events";

export { UserModel, USER_PUBLIC_FIELDS, type User } from "./models/user";
export { ProjectModel, type Project } from "./models/project";
export { DashboardModel, DASHBOARD_DOMAIN_REGEX, type Dashboard } from "./models/dashboard";
export { DashboardCollectionModel, type DashboardCollection } from "./models/collection";

export * from "./services/dashboards";
export * from "./services/projects";
export * from "./services/users";
export * from "./services/collections";
export { buildDashboardCsv } from "./services/csv";
export { getSiteCounts, type SiteCounts } from "./services/stats";
export { seed } from "./seed";
