import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser, type SignedUpTestUser } from "../../support/app/auth-flow";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import { seedTestFilm } from "../../support/factories/media.factory";
import { createListViaApi, jsonRequest, seedCollaborator, userIdOf } from "../../support/factories/list.factory";
import { MAX_LIST_COLLABORATORS } from "../../../src/modules/lists/constants/lists.constants";

type User = SignedUpTestUser & { id: string };
type Notification = { type: string; entityId: string; actorUsername: string; metadata: string | null };
type ListDetail = {
  viewerRole: string;
  ownerUsername: string;
  collaborators: Array<{ username: string; status: string }>;
  items: Array<{ id: string; addedBy: { username: string } | null }>;
};
type ListSummary = { id: string; role: string; ownerUsername: string; isPublic: boolean };

describe("List Collaborator lifecycle", () => {
  let server: RunningTestServer;

  beforeAll(async () => {
    server = await startTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  const signUp = async (prefix: string): Promise<User> => {
    const signed = await signUpTestUser(server.baseUrl, prefix);
    return { ...signed, id: await userIdOf(signed.username) };
  };

  const invite = (listId: string, owner: User, username: string) =>
    jsonRequest(server.baseUrl, `/api/lists/${listId}/collaborators`, "POST", { username }, owner.jar);
  const accept = (listId: string, as: User) =>
    jsonRequest(server.baseUrl, `/api/lists/${listId}/collaborators/accept`, "POST", undefined, as.jar);
  const removeCollaborator = (listId: string, as: User, userId: string) =>
    apiRequest(server.baseUrl, `/api/lists/${listId}/collaborators/${userId}`, { method: "DELETE" }, as.jar);
  const notificationsOf = async (as: User) => {
    const response = await apiRequest(server.baseUrl, "/api/notifications", {}, as.jar);
    return ((await response.json()) as { items: Notification[] }).items;
  };
  const detail = (listId: string, as?: User) => apiRequest(server.baseUrl, `/api/lists/${listId}`, {}, as?.jar);
  const profileLists = async (username: string, as?: User) => {
    const response = await apiRequest(server.baseUrl, `/api/users/${username}/lists`, {}, as?.jar);
    return (await response.json()) as ListSummary[];
  };

  it("invite → notification → accept → owner notified, invite notification resolved", async () => {
    const [owner, friend] = await Promise.all([signUp("lcown"), signUp("lcfrd")]);
    const list = await createListViaApi(server.baseUrl, owner.jar, { title: "Heist films", isPublic: false });

    const inviteResponse = await invite(list.id, owner, friend.username);
    expect(inviteResponse.status).toBe(201);

    const [invitation] = (await notificationsOf(friend)).filter((n) => n.type === "list_invite");
    expect(invitation).toMatchObject({ entityId: list.id, actorUsername: owner.username });
    expect(JSON.parse(invitation!.metadata ?? "{}")).toEqual({ listTitle: "Heist films" });

    // A pending invitee may preview the private list, but can't edit it yet.
    const preview = (await (await detail(list.id, friend)).json()) as ListDetail;
    expect(preview.viewerRole).toBe("invitee");
    expect(preview.collaborators).toEqual([expect.objectContaining({ username: friend.username, status: "invited" })]);

    expect((await accept(list.id, friend)).status).toBe(200);
    expect((await accept(list.id, friend)).status).toBe(404);

    expect((await notificationsOf(friend)).some((n) => n.type === "list_invite")).toBe(false);
    const accepted = (await notificationsOf(owner)).filter((n) => n.type === "list_invite_accepted");
    expect(accepted).toEqual([expect.objectContaining({ entityId: list.id, actorUsername: friend.username })]);

    const after = (await (await detail(list.id, friend)).json()) as ListDetail;
    expect(after.viewerRole).toBe("collaborator");
    expect(after.ownerUsername).toBe(owner.username);
  });

  it("declining removes the invite and its notification; the owner can invite again", async () => {
    const [owner, friend] = await Promise.all([signUp("ldown"), signUp("ldfrd")]);
    const list = await createListViaApi(server.baseUrl, owner.jar);
    await invite(list.id, owner, friend.username);

    expect((await removeCollaborator(list.id, friend, friend.id)).status).toBe(200);
    expect((await notificationsOf(friend)).some((n) => n.type === "list_invite")).toBe(false);
    expect((await accept(list.id, friend)).status).toBe(404);

    expect((await invite(list.id, owner, friend.username)).status).toBe(201);
  });

  it("a collaborator can leave; the owner can remove one; the owner can't leave", async () => {
    const [owner, a, b] = await Promise.all([signUp("llown"), signUp("llaaa"), signUp("llbbb")]);
    const list = await createListViaApi(server.baseUrl, owner.jar);
    await Promise.all([
      seedCollaborator(list.id, a.id, owner.id, "accepted"),
      seedCollaborator(list.id, b.id, owner.id, "accepted"),
    ]);

    expect((await removeCollaborator(list.id, a, a.id)).status).toBe(200);
    expect((await removeCollaborator(list.id, owner, b.id)).status).toBe(200);
    expect((await removeCollaborator(list.id, owner, b.id)).status).toBe(404);
    expect((await removeCollaborator(list.id, owner, owner.id)).status).toBe(400);

    const body = (await (await detail(list.id, owner)).json()) as ListDetail;
    expect(body.collaborators).toEqual([]);
  });

  it("rejects bad invites: unknown user, self, duplicate, and past the cap", async () => {
    const [owner, friend] = await Promise.all([signUp("liown"), signUp("lifrd")]);
    const list = await createListViaApi(server.baseUrl, owner.jar);

    expect((await invite(list.id, owner, "no_such_user_xyz")).status).toBe(404);
    expect((await invite(list.id, owner, owner.username)).status).toBe(400);
    expect((await invite(list.id, owner, friend.username)).status).toBe(201);
    expect((await invite(list.id, owner, friend.username)).status).toBe(409);

    const full = await createListViaApi(server.baseUrl, owner.jar);
    const fillers = await Promise.all(
      Array.from({ length: MAX_LIST_COLLABORATORS }, (_, i) => signUp(`lcap${i}`)),
    );
    await Promise.all(fillers.map((u) => seedCollaborator(full.id, u.id, owner.id, "invited")));
    const overCap = await invite(full.id, owner, friend.username);
    expect(overCap.status).toBe(400);
    expect(((await overCap.json()) as { error: { message: string } }).error.message).toContain(
      String(MAX_LIST_COLLABORATORS),
    );
  });

  it("a private list is visible to its owner, collaborators and invitees only", async () => {
    const [owner, collaborator, invitee, stranger] = await Promise.all([
      signUp("lvown"),
      signUp("lvcol"),
      signUp("lvinv"),
      signUp("lvstr"),
    ]);
    const list = await createListViaApi(server.baseUrl, owner.jar, { isPublic: false });
    await Promise.all([
      seedCollaborator(list.id, collaborator.id, owner.id, "accepted"),
      seedCollaborator(list.id, invitee.id, owner.id, "invited"),
    ]);

    expect((await detail(list.id, owner)).status).toBe(200);
    expect((await detail(list.id, collaborator)).status).toBe(200);
    expect((await detail(list.id, invitee)).status).toBe(200);
    expect((await detail(list.id, stranger)).status).toBe(404);
    expect((await detail(list.id)).status).toBe(404);

    // Pending invites aren't shown to other collaborators.
    const asCollaborator = (await (await detail(list.id, collaborator)).json()) as ListDetail;
    expect(asCollaborator.collaborators.map((c) => c.username)).toEqual([collaborator.username]);
  });

  it("shows shared lists on the collaborator's profile Lists tab, private ones only to them", async () => {
    const [owner, collaborator, visitor] = await Promise.all([signUp("lpown"), signUp("lpcol"), signUp("lpvis")]);
    const shared = await createListViaApi(server.baseUrl, owner.jar, { title: "Public shared" });
    const secret = await createListViaApi(server.baseUrl, owner.jar, { title: "Private shared", isPublic: false });
    const pending = await createListViaApi(server.baseUrl, owner.jar, { title: "Pending" });
    await Promise.all([
      seedCollaborator(shared.id, collaborator.id, owner.id, "accepted"),
      seedCollaborator(secret.id, collaborator.id, owner.id, "accepted"),
      seedCollaborator(pending.id, collaborator.id, owner.id, "invited"),
    ]);

    const own = await profileLists(collaborator.username, collaborator);
    expect(own.map((l) => l.id).sort()).toEqual([shared.id, secret.id].sort());
    expect(own.every((l) => l.role === "collaborator" && l.ownerUsername === owner.username)).toBe(true);

    const visiting = await profileLists(collaborator.username, visitor);
    expect(visiting.map((l) => l.id)).toEqual([shared.id]);

    const ownerView = await profileLists(owner.username, owner);
    expect(ownerView.every((l) => l.role === "owner")).toBe(true);
  });

  it("credits the collaborator who added an entry", async () => {
    const [owner, collaborator] = await Promise.all([signUp("laown"), signUp("lacol")]);
    const list = await createListViaApi(server.baseUrl, owner.jar);
    await seedCollaborator(list.id, collaborator.id, owner.id, "accepted");
    const [filmA, filmB] = await Promise.all([seedTestFilm("A"), seedTestFilm("B")]);

    await jsonRequest(server.baseUrl, `/api/lists/${list.id}/items`, "POST", { tmdbId: filmA.tmdbId, itemType: "movie" }, owner.jar);
    await jsonRequest(server.baseUrl, `/api/lists/${list.id}/items`, "POST", { tmdbId: filmB.tmdbId, itemType: "movie" }, collaborator.jar);
    const duplicate = await jsonRequest(
      server.baseUrl,
      `/api/lists/${list.id}/items`,
      "POST",
      { tmdbId: filmB.tmdbId, itemType: "movie" },
      owner.jar,
    );
    expect(duplicate.status).toBe(409);

    const body = (await (await detail(list.id)).json()) as ListDetail;
    expect(body.items.map((i) => i.addedBy?.username)).toEqual([owner.username, collaborator.username]);
  });
});
