import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { asc, eq } from "drizzle-orm";
import { signUpTestUser, type SignedUpTestUser } from "../../support/app/auth-flow";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import {
  createListViaApi,
  jsonRequest,
  seedCollaborator,
  seedListEntries,
  userIdOf,
} from "../../support/factories/list.factory";
import { db } from "../../../src/infrastructure/database/db";
import { listEntries } from "../../../src/modules/lists/lists.entity";

const positionsOf = async (listId: string) =>
  db
    .select({ id: listEntries.id, position: listEntries.position })
    .from(listEntries)
    .where(eq(listEntries.listId, listId))
    .orderBy(asc(listEntries.position));

describe("reordering a shared list", () => {
  let server: RunningTestServer;
  let owner: SignedUpTestUser;
  let collaborator: SignedUpTestUser;

  beforeAll(async () => {
    server = await startTestServer();
    [owner, collaborator] = await Promise.all([signUpTestUser(server.baseUrl, "roown"), signUpTestUser(server.baseUrl, "rocol")]);
  });

  afterAll(async () => {
    await server.close();
  });

  const setUp = async (entries: number) => {
    const list = await createListViaApi(server.baseUrl, owner.jar);
    const [ownerId, collaboratorId] = await Promise.all([userIdOf(owner.username), userIdOf(collaborator.username)]);
    await seedCollaborator(list.id, collaboratorId, ownerId, "accepted");
    return { listId: list.id, entryIds: await seedListEntries(list.id, entries) };
  };

  const reorder = (listId: string, ids: string[], as: SignedUpTestUser) =>
    jsonRequest(server.baseUrl, `/api/lists/${listId}/reorder`, "PATCH", { items: ids.map((id, i) => ({ id, position: i + 1 })) }, as.jar);

  it("two people reordering at once leave one complete, gap-free order", async () => {
    const { listId, entryIds } = await setUp(6);
    const reversed = [...entryIds].reverse();
    const rotated = [...entryIds.slice(2), ...entryIds.slice(0, 2)];

    const responses = await Promise.all([reorder(listId, reversed, owner), reorder(listId, rotated, collaborator)]);
    expect(responses.map((r) => r.status)).toEqual([200, 200]);

    const rows = await positionsOf(listId);
    expect(rows.map((r) => r.position)).toEqual([1, 2, 3, 4, 5, 6]);
    expect([reversed, rotated]).toContainEqual(rows.map((r) => r.id));
  });

  it("refuses a reorder built from a stale view, leaving positions untouched", async () => {
    const { listId, entryIds } = await setUp(3);
    const before = await positionsOf(listId);

    // Missing one entry (as if it were added after the client loaded the list).
    const response = await reorder(listId, entryIds.slice(0, 2).reverse(), collaborator);
    expect(response.status).toBe(409);
    expect(await positionsOf(listId)).toEqual(before);
  });

  it("rejects duplicate positions", async () => {
    const { listId, entryIds } = await setUp(2);
    const response = await jsonRequest(
      server.baseUrl,
      `/api/lists/${listId}/reorder`,
      "PATCH",
      { items: entryIds.map((id) => ({ id, position: 1 })) },
      owner.jar,
    );
    expect(response.status).toBe(400);
  });
});
