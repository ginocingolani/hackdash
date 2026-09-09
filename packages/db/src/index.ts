// @hackdash/db — shared data layer for the HackDash rewrite.
// Schemas are ported field-for-field from the legacy Mongoose models
// (see docs/legacy/server.md §2) so existing hackdash.org data remains
// readable without a destructive migration.

export { connectDb } from "./connect";
export { PROJECT_STATUSES, type ProjectStatus } from "./statuses";
export { UserModel, USER_PUBLIC_FIELDS, type User } from "./models/user";
export { ProjectModel, type Project } from "./models/project";
export { DashboardModel, DASHBOARD_DOMAIN_REGEX, type Dashboard } from "./models/dashboard";
export { DashboardCollectionModel, type DashboardCollection } from "./models/collection";
