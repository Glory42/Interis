import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { db } from "../../../src/infrastructure/database/db";
import { books } from "../../../src/modules/books/books.entity";
import { nytBestsellerCache } from "../../../src/modules/books/books.entity";
import { NYT_BESTSELLER_LIST } from "../../../src/modules/books/constants/books.constants";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

describe("books trending archive (NYT bestsellers)", () => {
  let testServer: RunningTestServer | null = null;

  const getServer = (): RunningTestServer => {
    if (!testServer) {
      throw new Error("Test server is not running");
    }
    return testServer;
  };

  beforeAll(async () => {
    testServer = await startTestServer();
  });

  afterAll(async () => {
    if (!testServer) return;
    await testServer.close();
    testServer = null;
  });

  it("returns the NYT-ranked list, resolved against already-cached books, without calling NYT or Google Books", async () => {
    const isbn13 = `978${Math.floor(Math.random() * 1_000_000_000)}`;
    const volumeId = `test-volume-${crypto.randomUUID()}`;

    await db.insert(books).values({
      googleVolumeId: volumeId,
      title: "The Test Novel",
      authors: ["Test Author"],
      isbn13,
    });

    await db
      .insert(nytBestsellerCache)
      .values({
        listName: NYT_BESTSELLER_LIST,
        items: [{ rank: 1, isbn13, title: "The Test Novel", author: "Test Author" }],
      })
      .onConflictDoUpdate({
        target: nytBestsellerCache.listName,
        set: {
          items: [{ rank: 1, isbn13, title: "The Test Novel", author: "Test Author" }],
          fetchedAt: new Date(),
        },
      });

    const response = await apiRequest(
      getServer().baseUrl,
      "/api/books/archive?sort=trending",
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      selectedSort: string;
      items: Array<{ googleVolumeId: string; title: string }>;
    };

    expect(body.selectedSort).toBe("trending");
    expect(body.items.some((item) => item.googleVolumeId === volumeId)).toBe(true);
  });
});
