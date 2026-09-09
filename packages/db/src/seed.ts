import { connectDb } from "./connect";
import { UserModel } from "./models/user";
import { createDashboard, updateDashboard } from "./services/dashboards";
import { createProject } from "./services/projects";
import { createCollection, addDashboardToCollection } from "./services/collections";
import { PROJECT_STATUSES } from "./statuses";

// Development seed. Replaces the legacy /install flow: creates an admin user
// (by email if --admin given), demo dashboards, projects, and a collection.
// Usage: pnpm --filter @hackdash/db seed [-- --admin you@example.com]
export async function seed({ adminEmail }: { adminEmail?: string } = {}) {
  await connectDb();

  const admin = await UserModel.findOneAndUpdate(
    { email: adminEmail ?? "admin@hackdash.local" },
    {
      $setOnInsert: {
        provider: "seed",
        provider_id: "seed-admin",
        username: "admin",
        name: "Seed Admin",
        bio: "Local development admin",
      },
    },
    { upsert: true, new: true }
  );

  const hackers = await Promise.all(
    ["ada", "grace", "linus"].map((username, i) =>
      UserModel.findOneAndUpdate(
        { username, provider: "seed" },
        {
          $setOnInsert: {
            provider: "seed",
            provider_id: `seed-${username}`,
            name: username[0].toUpperCase() + username.slice(1),
            email: `${username}@hackdash.local`,
            bio: `Demo hacker #${i + 1}`,
          },
        },
        { upsert: true, new: true }
      )
    )
  );

  const domains = ["mediaparty", "demoweek"];
  for (const domain of domains) {
    try {
      await createDashboard(String(admin._id), domain);
    } catch {
      continue; // already seeded
    }
    await updateDashboard(domain, String(admin._id), {
      title: domain === "mediaparty" ? "Media Party 2026" : "Demo Week",
      description: "Seeded demo dashboard",
      link: "example.com",
    });
    for (let i = 0; i < 4; i++) {
      const leader = i === 0 ? admin : hackers[i % hackers.length];
      await createProject(String(leader._id), {
        domain,
        title: `${domain} project ${i + 1}`,
        description: `A seeded demo project (#${i + 1}) on ${domain}.`,
        status: PROJECT_STATUSES[i % PROJECT_STATUSES.length],
        tags: ["demo", domain],
        cover: i % 2 === 0 ? `https://picsum.photos/seed/${domain}${i}/600/400` : undefined,
      });
    }
  }

  const collection = await createCollection(String(admin._id), {
    title: "Media Party over the years",
    description: "Seeded demo collection",
  });
  for (const domain of domains) {
    const dash = await (await import("./models/dashboard")).DashboardModel.findOne({ domain });
    if (dash) await addDashboardToCollection(String(collection._id), String(admin._id), String(dash._id));
  }

  return { adminId: String(admin._id) };
}
