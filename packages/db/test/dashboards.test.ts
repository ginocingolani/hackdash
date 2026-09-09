import { describe, expect, it } from "vitest";
import {
  createDashboard,
  deleteDashboard,
  getDashboard,
  isDomainAvailable,
  listDashboards,
  recomputeDashboardDenorms,
  updateDashboard,
} from "../src/services/dashboards";
import { grantAdmin } from "../src/services/users";
import { createProject, deleteProject } from "../src/services/projects";
import { DashboardModel } from "../src/models/dashboard";
import { UserModel } from "../src/models/user";
import { ServiceError } from "../src/errors";
import { id, makeUser } from "./fixtures";

describe("createDashboard", () => {
  it("creates and grants admin_in to the creator", async () => {
    const user = await makeUser();
    const dash = await createDashboard(id(user), "mydash");
    expect(dash.domain).toBe("mydash");
    expect(dash.open).toBe(true);
    const fresh = await UserModel.findById(user._id);
    expect(fresh!.admin_in).toContain("mydash");
  });

  it("accepts legacy 5-10 char slugs and longer modern ones", async () => {
    const user = await makeUser();
    await createDashboard(id(user), "abcde");
    await createDashboard(id(user), "mediaparty26");
  });

  it("rejects invalid and reserved domains", async () => {
    const user = await makeUser();
    for (const bad of ["ab", "-abc-", "UPPER", "has space", "api", "www"]) {
      await expect(createDashboard(id(user), bad)).rejects.toMatchObject({
        code: "subdomain_invalid",
      });
    }
  });

  it("rejects a taken domain with subdomain_inuse", async () => {
    const user = await makeUser();
    await createDashboard(id(user), "mydash");
    await expect(createDashboard(id(user), "mydash")).rejects.toMatchObject({
      code: "subdomain_inuse",
      status: 409,
    });
    expect(await isDomainAvailable("mydash")).toBe(false);
  });
});

describe("updateDashboard", () => {
  it("allows admins, forbids others, never changes domain/owner", async () => {
    const owner = await makeUser();
    const stranger = await makeUser();
    await createDashboard(id(owner), "mydash");
    await updateDashboard("mydash", id(owner), { title: "T", link: "example.com" });
    const dash = await getDashboard("mydash");
    expect(dash.title).toBe("T");
    expect(dash.link).toBe("http://example.com");
    await expect(updateDashboard("mydash", id(stranger), { title: "X" })).rejects.toMatchObject({
      status: 403,
    });
  });

  it("replaces showcase only when given an array (legacy contract)", async () => {
    const owner = await makeUser();
    await createDashboard(id(owner), "mydash");
    await updateDashboard("mydash", id(owner), { showcase: ["a", "b"] });
    let dash = await DashboardModel.findOne({ domain: "mydash" });
    expect(dash!.showcase).toEqual(["a", "b"]);
    await updateDashboard("mydash", id(owner), {
      showcase: "nope" as unknown as string[],
      title: "kept",
    });
    dash = await DashboardModel.findOne({ domain: "mydash" });
    expect(dash!.showcase).toEqual(["a", "b"]);
  });
});

describe("deleteDashboard (legacy bug #2 regression)", () => {
  it("refuses when the dashboard has more than one admin", async () => {
    const owner = await makeUser();
    const coAdmin = await makeUser();
    await createDashboard(id(owner), "mydash");
    await grantAdmin("mydash", id(owner), id(coAdmin));
    // In legacy this guard never fired (unawaited count); it must fire now.
    await expect(deleteDashboard("mydash", id(owner))).rejects.toMatchObject({
      code: "dashboard_has_admins",
    });
  });

  it("refuses when projects exist, allows when empty, cleans admin grants", async () => {
    const owner = await makeUser();
    await createDashboard(id(owner), "mydash");
    const project = await createProject(id(owner), {
      domain: "mydash",
      title: "P",
      description: "D",
    });
    await expect(deleteDashboard("mydash", id(owner))).rejects.toMatchObject({
      code: "dashboard_has_projects",
    });
    await deleteProject(String(project._id), id(owner));
    await deleteDashboard("mydash", id(owner));
    expect(await DashboardModel.findOne({ domain: "mydash" })).toBeNull();
    const fresh = await UserModel.findById(owner._id);
    expect(fresh!.admin_in).not.toContain("mydash");
  });

  it("only the owner can delete", async () => {
    const owner = await makeUser();
    const other = await makeUser();
    await createDashboard(id(owner), "mydash");
    await expect(deleteDashboard("mydash", id(other))).rejects.toMatchObject({ status: 403 });
  });
});

describe("listDashboards", () => {
  it("landing filter requires >1 project and covers, without $where", async () => {
    const user = await makeUser();
    await createDashboard(id(user), "vibrant");
    await createDashboard(id(user), "emptyone");
    for (let i = 0; i < 2; i++) {
      await createProject(id(user), {
        domain: "vibrant",
        title: `P${i}`,
        description: "D",
        cover: `http://x/${i}.png`,
      });
    }
    const results = await listDashboards();
    expect(results.map((d) => d.domain)).toEqual(["vibrant"]);
  });

  it("search matches domain/title/description case-insensitively", async () => {
    const user = await makeUser();
    await createDashboard(id(user), "mydash");
    await updateDashboard("mydash", id(user), { title: "Great Hackathon" });
    const results = await listDashboards({ q: "great" });
    expect(results).toHaveLength(1);
  });
});

describe("denormalization", () => {
  it("keeps covers and projectsCount in sync on project writes", async () => {
    const user = await makeUser();
    await createDashboard(id(user), "mydash");
    const p1 = await createProject(id(user), {
      domain: "mydash",
      title: "A",
      description: "D",
      cover: "http://x/a.png",
    });
    await createProject(id(user), { domain: "mydash", title: "B", description: "D" });
    let dash = await DashboardModel.findOne({ domain: "mydash" });
    expect(dash!.projectsCount).toBe(2);
    expect(dash!.covers).toEqual(["http://x/a.png"]);
    await deleteProject(String(p1._id), id(user));
    dash = await DashboardModel.findOne({ domain: "mydash" });
    expect(dash!.projectsCount).toBe(1);
    expect(dash!.covers).toEqual([]);
    await recomputeDashboardDenorms("mydash");
    dash = await DashboardModel.findOne({ domain: "mydash" });
    expect(dash!.projectsCount).toBe(1);
  });
});

it("ServiceError carries code and status", () => {
  const err = new ServiceError("subdomain_invalid", 400);
  expect(err.code).toBe("subdomain_invalid");
  expect(err.status).toBe(400);
});
