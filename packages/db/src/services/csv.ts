import { ProjectModel } from "../models/project";
import type { User } from "../models/user";

function csvCell(value: unknown): string {
  const s = value == null ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Legacy header preserved verbatim (partner spreadsheets may depend on it).
// Legacy bug #3 fixed: contributors were iterated twice and followers never
// exported; now each membership is emitted once with the right engagement.
export async function buildDashboardCsv(domain: string): Promise<string> {
  const projects = await ProjectModel.find({ domain })
    .populate("leader contributors followers", "name username provider email")
    .select("title status domain leader contributors followers");

  const rows: string[] = ["name,username,provider,e-mail,engagement,project,status,dashboard"];
  const pushRow = (user: User | null, engagement: string, project: { title: string; status?: string | null }) => {
    if (!user) return;
    rows.push(
      [user.name, user.username, user.provider, user.email, engagement, project.title, project.status, domain]
        .map(csvCell)
        .join(",")
    );
  };

  for (const project of projects) {
    const leaderId = String((project.leader as { _id?: unknown } | null)?._id ?? project.leader);
    pushRow(project.leader as unknown as User, "leader", project);
    for (const contributor of project.contributors as unknown as (User & { _id: unknown })[]) {
      if (String(contributor._id) !== leaderId) pushRow(contributor, "contributor", project);
    }
    for (const follower of project.followers as unknown as (User & { _id: unknown })[]) {
      if (String(follower._id) !== leaderId) pushRow(follower, "follower", project);
    }
  }
  return rows.join("\n");
}
