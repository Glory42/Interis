import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { promoteToAdmin } from "../../support/factories/admin.factory";
import { seedTestMovie, seedTestSerial } from "../../support/factories/media.factory";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

describe("admin media actions", () => {
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

  const makeAdmin = async (prefix: string) => {
    const admin = await signUpTestUser(getServer().baseUrl, prefix);
    await promoteToAdmin(admin.username);
    return admin;
  };

  describe("movies", () => {
    it("lists and searches movies", async () => {
      const admin = await makeAdmin("amvadmin1");
      const movie = await seedTestMovie("Admin Search Movie");

      const listResponse = await apiRequest(getServer().baseUrl, "/api/admin/movies", {}, admin.jar);
      expect(listResponse.status).toBe(200);

      const searchResponse = await apiRequest(
        getServer().baseUrl,
        `/api/admin/movies?query=${encodeURIComponent("Admin Search Movie")}`,
        {},
        admin.jar,
      );
      const results = (await searchResponse.json()) as Array<{ tmdbId: number }>;
      expect(results.some((m) => m.tmdbId === movie.tmdbId)).toBe(true);
    });

    it("returns 404 updating/refreshing/deleting a non-existent movie id", async () => {
      const admin = await makeAdmin("amvghost");

      const updateResponse = await apiRequest(
        getServer().baseUrl,
        "/api/admin/movies/99999999",
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title: "New Title" }),
        },
        admin.jar,
      );
      expect(updateResponse.status).toBe(404);

      const refreshResponse = await apiRequest(
        getServer().baseUrl,
        "/api/admin/movies/99999999/refresh",
        { method: "POST" },
        admin.jar,
      );
      expect(refreshResponse.status).toBe(404);

      const deleteResponse = await apiRequest(
        getServer().baseUrl,
        "/api/admin/movies/99999999",
        { method: "DELETE" },
        admin.jar,
      );
      expect(deleteResponse.status).toBe(404);
    });

    it("updates and deletes a movie", async () => {
      const admin = await makeAdmin("amvedit");
      const movie = await seedTestMovie("Original Title");

      const updateResponse = await apiRequest(
        getServer().baseUrl,
        `/api/admin/movies/${movie.id}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title: "Edited Title", overview: "Edited overview" }),
        },
        admin.jar,
      );
      expect(updateResponse.status).toBe(200);
      const updated = (await updateResponse.json()) as { title: string; overview: string };
      expect(updated.title).toBe("Edited Title");
      expect(updated.overview).toBe("Edited overview");

      const deleteResponse = await apiRequest(
        getServer().baseUrl,
        `/api/admin/movies/${movie.id}`,
        { method: "DELETE" },
        admin.jar,
      );
      expect(deleteResponse.status).toBe(200);
    });
  });

  describe("serials", () => {
    it("lists serials", async () => {
      const admin = await makeAdmin("aserialadmin");
      await seedTestSerial("Admin Search Serial");

      const listResponse = await apiRequest(getServer().baseUrl, "/api/admin/serials", {}, admin.jar);
      expect(listResponse.status).toBe(200);
    });

    it("returns 404 refreshing a non-existent serial id", async () => {
      const admin = await makeAdmin("aserialghost");
      const response = await apiRequest(
        getServer().baseUrl,
        "/api/admin/serials/99999999/refresh",
        { method: "POST" },
        admin.jar,
      );
      expect(response.status).toBe(404);
    });

    it("updates and deletes a serial", async () => {
      const admin = await makeAdmin("aserialedit");
      const serial = await seedTestSerial("Original Serial Title");

      const updateResponse = await apiRequest(
        getServer().baseUrl,
        `/api/admin/serials/${serial.id}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title: "Edited Serial Title" }),
        },
        admin.jar,
      );
      expect(updateResponse.status).toBe(200);
      const updated = (await updateResponse.json()) as { title: string };
      expect(updated.title).toBe("Edited Serial Title");

      const deleteResponse = await apiRequest(
        getServer().baseUrl,
        `/api/admin/serials/${serial.id}`,
        { method: "DELETE" },
        admin.jar,
      );
      expect(deleteResponse.status).toBe(200);
    });
  });
});
