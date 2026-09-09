import { describe, expect, it } from "vitest";
import { createDashboard, updateDashboard } from "../src/services/dashboards";
import {
  createProject,
  followProject,
  getProject,
  getStatusCounts,
  joinProject,
  leaveProject,
  listProjects,
  unfollowProject,
  updateProject,
} from "../src/services/projects";
import { activityBus, type ActivityEvent } from "../src/events";
import { id, makeUser } from "./fixtures";

async function seedDashboard() {
  const owner = await makeUser();
  await createDashboard(id(owner), "mydash");
  return owner;
}

describe("createProject", () => {
  it("requires an existing, open dashboard and title/description", async () => {
    const owner = await seedDashboard();
    await expect(
      createProject(id(owner), { domain: "nope", title: "T", description: "D" })
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      createProject(id(owner), { domain: "mydash", title: "", description: "D" })
    ).rejects.toMatchObject({ code: "title_required" });
    await expect(
      createProject(id(owner), { domain: "mydash", title: "T", description: " " })
    ).rejects.toMatchObject({ code: "description_required" });
    await updateDashboard("mydash", id(owner), { open: false });
    await expect(
      createProject(id(owner), { domain: "mydash", title: "T", description: "D" })
    ).rejects.toMatchObject({ code: "dashboard_closed", status: 403 });
  });

  it("sets creator as leader/contributor/follower, normalizes tags and link", async () => {
    const owner = await seedDashboard();
    const project = await createProject(id(owner), {
      domain: "mydash",
      title: "T",
      description: "D",
      link: "example.com",
      tags: "News, news , DATA-viz ,",
      status: "building",
    });
    expect(project.link).toBe("http://example.com");
    expect(project.tags).toEqual(["news", "data-viz"]);
    expect(project.status).toBe("building");
    expect(String((project.leader as { _id: unknown })._id)).toBe(id(owner));
    expect(project.contributors).toHaveLength(1);
    expect(project.followers).toHaveLength(1);
  });

  it("falls back to the canonical first status on invalid status", async () => {
    const owner = await seedDashboard();
    const project = await createProject(id(owner), {
      domain: "mydash",
      title: "T",
      description: "D",
      status: "shipping-it",
    });
    expect(project.status).toBe("brainstorming");
  });
});

describe("updateProject authorization", () => {
  it("allows leader and dashboard admin, forbids others", async () => {
    const owner = await seedDashboard();
    const leader = await makeUser();
    const stranger = await makeUser();
    const project = await createProject(id(leader), {
      domain: "mydash",
      title: "T",
      description: "D",
    });
    const pid = String(project._id);
    await updateProject(pid, id(leader), { title: "By leader" });
    await updateProject(pid, id(owner), { title: "By admin" });
    await expect(updateProject(pid, id(stranger), { title: "Nope" })).rejects.toMatchObject({
      status: 403,
    });
    expect((await getProject(pid)).title).toBe("By admin");
  });
});

describe("membership guards (legacy bug #4 regression)", () => {
  it("blocks the leader from leaving or unfollowing their own project", async () => {
    const owner = await seedDashboard();
    const project = await createProject(id(owner), {
      domain: "mydash",
      title: "T",
      description: "D",
    });
    const pid = String(project._id);
    // In legacy this compared ObjectId to string, so it never fired.
    await expect(leaveProject(pid, id(owner))).rejects.toMatchObject({
      code: "leader_cannot_leave",
    });
    await expect(unfollowProject(pid, id(owner))).rejects.toMatchObject({
      code: "leader_cannot_leave",
    });
  });

  it("lets others join/leave/follow/unfollow and emits activity", async () => {
    const owner = await seedDashboard();
    const fan = await makeUser();
    const project = await createProject(id(owner), {
      domain: "mydash",
      title: "T",
      description: "D",
    });
    const pid = String(project._id);
    const events: ActivityEvent[] = [];
    const off = activityBus.onActivity((e) => events.push(e));
    try {
      await joinProject(pid, id(fan));
      await followProject(pid, id(fan));
      await leaveProject(pid, id(fan));
      await unfollowProject(pid, id(fan));
    } finally {
      off();
    }
    const fresh = await getProject(pid);
    expect(fresh.contributors).toHaveLength(1);
    expect(fresh.followers).toHaveLength(1);
    expect(events.map((e) => e.type)).toEqual([
      "project_join",
      "project_follow",
      "project_leave",
      "project_unfollow",
    ]);
    // Legacy bug #10: payloads carried full user docs including email.
    for (const event of events) {
      expect(event.user).not.toHaveProperty("email");
      expect(event.domain).toBe("mydash");
    }
  });
});

describe("listProjects", () => {
  it("landing filter returns only projects with covers; domain filter returns all", async () => {
    const owner = await seedDashboard();
    await createProject(id(owner), {
      domain: "mydash",
      title: "Covered",
      description: "D",
      cover: "http://x/a.png",
    });
    await createProject(id(owner), { domain: "mydash", title: "Bare", description: "D" });
    expect((await listProjects()).map((p) => p.title)).toEqual(["Covered"]);
    expect(await listProjects({ domain: "mydash" })).toHaveLength(2);
  });

  it("search matches tags and escapes regex metacharacters", async () => {
    const owner = await seedDashboard();
    await createProject(id(owner), {
      domain: "mydash",
      title: "T",
      description: "D",
      tags: ["dataviz"],
    });
    expect(await listProjects({ q: "dataviz" })).toHaveLength(1);
    expect(await listProjects({ q: "a+b(c" })).toHaveLength(0); // must not throw
  });
});

it("getStatusCounts aggregates per status", async () => {
  const owner = await seedDashboard();
  await createProject(id(owner), { domain: "mydash", title: "A", description: "D", status: "building" });
  await createProject(id(owner), { domain: "mydash", title: "B", description: "D", status: "building" });
  await createProject(id(owner), { domain: "mydash", title: "C", description: "D" });
  expect(await getStatusCounts("mydash")).toEqual({ building: 2, brainstorming: 1 });
});
