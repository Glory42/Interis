import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import { db } from "../../../src/infrastructure/database/db";
import { listEntries } from "../../../src/modules/lists/lists.entity";
import { ListsReadRepository } from "../../../src/modules/lists/repositories/lists-read.repository";

describe("list cover images", () => {
  let testServer: RunningTestServer | null = null;

  beforeAll(async () => {
    testServer = await startTestServer();
  });

  afterAll(async () => {
    await testServer?.close();
    testServer = null;
  });

  it("reads only the first four entries of each list, in position order", async () => {
    const baseUrl = testServer!.baseUrl;
    const { jar } = await signUpTestUser(baseUrl, "covers");
    const createList = async (title: string) => {
      const response = await apiRequest(
        baseUrl,
        "/api/lists",
        { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title }) },
        jar,
      );
      return ((await response.json()) as { id: string }).id;
    };
    const [longList, shortList] = [await createList("Long"), await createList("Short")];

    await db.insert(listEntries).values([
      ...[9, 3, 7, 1, 5, 2].map((position) => ({ listId: longList, itemType: "movie", position })),
      { listId: shortList, itemType: "tv", position: 1 },
    ]);

    const rows = await ListsReadRepository.getCoverImages([longList, shortList]);
    const positionsOf = (listId: string) => rows.filter((row) => row.listId === listId).map((row) => row.position);

    expect(positionsOf(longList)).toEqual([1, 2, 3, 5]);
    expect(positionsOf(shortList)).toEqual([1]);
  });
});
