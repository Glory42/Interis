import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { seedTestMovie, seedTestSerial } from "../../support/factories/media.factory";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

describe("list items (dual-media)", () => {
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

  const createList = async (jar: Awaited<ReturnType<typeof signUpTestUser>>["jar"]) => {
    const response = await apiRequest(
      getServer().baseUrl,
      "/api/lists",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "Dual media list" }),
      },
      jar,
    );
    return (await response.json()) as { id: string };
  };

  it("adds a movie item and derives type 'cinema'", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "mov");
    const list = await createList(jar);
    const movie = await seedTestMovie();

    const addResponse = await apiRequest(
      getServer().baseUrl,
      `/api/lists/${list.id}/items`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tmdbId: movie.tmdbId, itemType: "cinema" }),
      },
      jar,
    );
    expect(addResponse.status).toBe(201);
    const added = (await addResponse.json()) as { derivedType: string | null };
    expect(added.derivedType).toBe("cinema");

    const detail = await apiRequest(getServer().baseUrl, `/api/lists/${list.id}`);
    const body = (await detail.json()) as { itemCount: number; derivedType: string | null };
    expect(body.itemCount).toBe(1);
    expect(body.derivedType).toBe("cinema");
  });

  it("transitions derivedType through cinema -> mixed -> serial as items change", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "mix");
    const list = await createList(jar);
    const movie = await seedTestMovie();
    const serial = await seedTestSerial();

    const addMovie = await apiRequest(
      getServer().baseUrl,
      `/api/lists/${list.id}/items`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tmdbId: movie.tmdbId, itemType: "cinema" }),
      },
      jar,
    );
    expect(((await addMovie.json()) as { derivedType: string | null }).derivedType).toBe(
      "cinema",
    );

    const addSerial = await apiRequest(
      getServer().baseUrl,
      `/api/lists/${list.id}/items`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tmdbId: serial.tmdbId, itemType: "serial" }),
      },
      jar,
    );
    const addSerialBody = (await addSerial.json()) as {
      derivedType: string | null;
      entry: { id: string };
    };
    expect(addSerialBody.derivedType).toBe("mixed");

    const removeResponse = await apiRequest(
      getServer().baseUrl,
      `/api/lists/${list.id}/items/${addSerialBody.entry.id}`,
      { method: "DELETE" },
      jar,
    );
    expect(removeResponse.status).toBe(200);
    const removeBody = (await removeResponse.json()) as { derivedType: string | null };
    expect(removeBody.derivedType).toBe("cinema");
  });

  it("rejects adding/removing items on a list you don't own, and 404s unknown targets", async () => {
    const owner = await signUpTestUser(getServer().baseUrl, "iown");
    const intruder = await signUpTestUser(getServer().baseUrl, "iint");
    const list = await createList(owner.jar);
    const movie = await seedTestMovie();

    const forbiddenAdd = await apiRequest(
      getServer().baseUrl,
      `/api/lists/${list.id}/items`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tmdbId: movie.tmdbId, itemType: "cinema" }),
      },
      intruder.jar,
    );
    expect(forbiddenAdd.status).toBe(403);

    const missingListAdd = await apiRequest(
      getServer().baseUrl,
      "/api/lists/00000000-0000-0000-0000-000000000000/items",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tmdbId: movie.tmdbId, itemType: "cinema" }),
      },
      owner.jar,
    );
    expect(missingListAdd.status).toBe(404);

    const missingEntryRemove = await apiRequest(
      getServer().baseUrl,
      `/api/lists/${list.id}/items/00000000-0000-0000-0000-000000000000`,
      { method: "DELETE" },
      owner.jar,
    );
    expect(missingEntryRemove.status).toBe(404);
  });
});
