import { describe, expect, it } from "vitest";
import { createDashboard } from "../src/services/dashboards";
import {
  findOrCreateAuthUser,
  getProfile,
  getUser,
  grantAdmin,
  listAdmins,
  revokeAdmin,
  searchUsers,
  updateProfile,
} from "../src/services/users";
import {
  addDashboardToCollection,
  createCollection,
  deleteCollection,
  getCollection,
  listCollections,
  listOwnCollections,
  removeDashboardFromCollection,
  updateCollection,
} from "../src/services/collections";
import { createProject, followProject, joinProject } from "../src/services/projects";
import { buildDashboardCsv } from "../src/services/csv";
import { DashboardModel } from "../src/models/dashboard";
import { UserModel } from "../src/models/user";
import { id, makeUser } from "./fixtures";

describe("admin grants", () => {
  it("grant requires admin; revoke works and protects the last admin (legacy bug #12)", async () => {
    const owner = await makeUser();
    const co = await makeUser();
    const stranger = await makeUser();
    await createDashboard(id(owner), "mydash");
    await expect(grantAdmin("mydash", id(stranger), id(co))).rejects.toMatchObject({ status: 403 });
    await grantAdmin("mydash", id(owner), id(co));
    expect((await listAdmins("mydash")).map((u) => u.username).sort()).toEqual(
      [owner.username, co.username].sort()
    );
    await revokeAdmin("mydash", id(owner), id(co));
    expect(await listAdmins("mydash")).toHaveLength(1);
    await expect(revokeAdmin("mydash", id(owner), id(owner))).rejects.toMatchObject({
      code: "last_admin",
    });
  });
});

describe("profiles (legacy bug #9 regression)", () => {
  it("updates the target document, self-only, with validation", async () => {
    const user = await makeUser();
    const other = await makeUser();
    await expect(
      updateProfile(id(user), id(other), { name: "X", email: "x@y.zz" })
    ).rejects.toMatchObject({ status: 403 });
    await expect(updateProfile(id(user), id(user), { name: "", email: "x@y.zz" })).rejects.toMatchObject(
      { code: "name_required" }
    );
    await expect(updateProfile(id(user), id(user), { name: "X", email: "bad" })).rejects.toMatchObject(
      { code: "email_invalid" }
    );
    await updateProfile(id(user), id(user), { name: "New Name", email: "new@mail.zz", bio: "hi" });
    const fresh = await UserModel.findById(user._id);
    expect(fresh!.name).toBe("New Name");
    expect(fresh!.email).toBe("new@mail.zz");
  });

  it("hides email from everyone but the user themself", async () => {
    const user = await makeUser();
    const other = await makeUser();
    expect((await getUser(id(user))).email).toBeUndefined();
    expect((await getUser(id(user), id(other))).email).toBeUndefined();
    expect((await getUser(id(user), id(user))).email).toBe(user.email);
  });

  it("aggregates profile: led, contributions, likes are disjoint", async () => {
    const owner = await makeUser();
    const fan = await makeUser();
    await createDashboard(id(owner), "mydash");
    const project = await createProject(id(owner), { domain: "mydash", title: "T", description: "D" });
    await joinProject(String(project._id), id(fan));
    await followProject(String(project._id), id(fan));
    const ownerProfile = await getProfile(id(owner));
    expect(ownerProfile.projects).toHaveLength(1);
    expect(ownerProfile.contributions).toHaveLength(0);
    expect(ownerProfile.likes).toHaveLength(0);
    expect(ownerProfile.dashboards).toHaveLength(1);
    const fanProfile = await getProfile(id(fan));
    expect(fanProfile.projects).toHaveLength(0);
    expect(fanProfile.contributions).toHaveLength(1);
    expect(fanProfile.likes).toHaveLength(1);
  });
});

describe("searchUsers", () => {
  it("without q lists only users with a bio; with q searches name/username but not email", async () => {
    await makeUser({ bio: "civic hacker" });
    await makeUser({ bio: "" });
    await makeUser();
    expect(await searchUsers()).toHaveLength(1);
    await makeUser({ name: "Findable Person", email: "secretmail@test.local" });
    expect(await searchUsers({ q: "findable" })).toHaveLength(1);
    expect(await searchUsers({ q: "secretmail" })).toHaveLength(0);
  });
});

describe("findOrCreateAuthUser bridge", () => {
  it("matches legacy Number provider_ids and updates the picture", async () => {
    await UserModel.create({
      provider: "github",
      provider_id: 12345,
      username: "legacy",
      name: "Legacy User",
    });
    const found = await findOrCreateAuthUser({
      provider: "github",
      providerId: "12345",
      picture: "http://x/new.png",
    });
    expect(found.username).toBe("legacy");
    expect(found.picture).toBe("http://x/new.png");
    expect(await UserModel.countDocuments()).toBe(1);
  });

  it("attaches magic-link sign-ins to an existing account by email, else creates", async () => {
    const user = await makeUser({ email: "known@test.local" });
    const found = await findOrCreateAuthUser({
      provider: "email",
      providerId: "known@test.local",
      email: "known@test.local",
    });
    expect(String(found._id)).toBe(id(user));
    const created = await findOrCreateAuthUser({
      provider: "email",
      providerId: "new@test.local",
      email: "new@test.local",
    });
    expect(created.username).toBe("new");
  });
});

describe("collections write path (legacy bug #1 regression)", () => {
  it("create/update/add/remove/delete all work, owner-only", async () => {
    const owner = await makeUser();
    const other = await makeUser();
    await createDashboard(id(owner), "mydash");
    const dash = await DashboardModel.findOne({ domain: "mydash" });

    await expect(createCollection(id(owner), {})).rejects.toMatchObject({ code: "title_required" });
    const collection = await createCollection(id(owner), { title: "Yearly", description: "d" });
    const cid = String(collection._id);

    await expect(updateCollection(cid, id(other), { title: "X" })).rejects.toMatchObject({ status: 403 });
    await updateCollection(cid, id(owner), { title: "Media Party over the years" });

    await addDashboardToCollection(cid, id(owner), String(dash!._id));
    expect((await getCollection(cid)).dashboards).toHaveLength(1);
    expect(await listOwnCollections(id(owner))).toHaveLength(1);
    expect(await listCollections({ q: "media party" })).toHaveLength(1);

    await removeDashboardFromCollection(cid, id(owner), String(dash!._id));
    expect((await getCollection(cid)).dashboards).toHaveLength(0);

    await expect(deleteCollection(cid, id(other))).rejects.toMatchObject({ status: 403 });
    await deleteCollection(cid, id(owner));
    await expect(getCollection(cid)).rejects.toMatchObject({ status: 404 });
  });
});

describe("dashboard CSV (legacy bug #3 regression)", () => {
  it("emits leader, contributors and followers once each with correct engagement", async () => {
    const owner = await makeUser();
    const contributor = await makeUser();
    const follower = await makeUser();
    await createDashboard(id(owner), "mydash");
    const project = await createProject(id(owner), { domain: "mydash", title: "T", description: "D" });
    await joinProject(String(project._id), id(contributor));
    await followProject(String(project._id), id(follower));

    const csv = buildDashboardCsv("mydash");
    const lines = (await csv).split("\n");
    expect(lines[0]).toBe("name,username,provider,e-mail,engagement,project,status,dashboard");
    const engagements = lines.slice(1).map((l) => l.split(",")[4]).sort();
    // Legacy exported contributors twice and followers never.
    expect(engagements).toEqual(["contributor", "follower", "leader"]);
  });
});
