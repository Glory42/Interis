import { afterAll, afterEach, beforeAll, describe, expect, it, spyOn } from "bun:test";
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

describe("uploads", () => {
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

  describe("POST /api/uploads/request", () => {
    it("requires auth", async () => {
      const response = await apiRequest(getServer().baseUrl, "/api/uploads/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          uploadType: "avatar",
          contentType: "image/png",
          fileSizeBytes: 1024,
        }),
      });
      expect(response.status).toBe(401);
    });

    it("rejects an unsupported content type", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "upreq1");
      const response = await apiRequest(
        getServer().baseUrl,
        "/api/uploads/request",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            uploadType: "avatar",
            contentType: "image/gif",
            fileSizeBytes: 1024,
          }),
        },
        jar,
      );
      expect(response.status).toBe(400);
    });

    it("rejects a file over the 10MB cap", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "upreq2");
      const response = await apiRequest(
        getServer().baseUrl,
        "/api/uploads/request",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            uploadType: "avatar",
            contentType: "image/png",
            fileSizeBytes: 10 * 1024 * 1024 + 1,
          }),
        },
        jar,
      );
      expect(response.status).toBe(400);
    });

    it("returns 503 when R2 storage is not configured", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "upreq3");
      const response = await apiRequest(
        getServer().baseUrl,
        "/api/uploads/request",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            uploadType: "avatar",
            contentType: "image/png",
            fileSizeBytes: 1024,
          }),
        },
        jar,
      );
      // This test suite runs with no R2_* env vars set, matching CI —
      // exercises the exact branch a misconfigured deploy would hit.
      expect(response.status).toBe(503);
      const body = (await response.json()) as { error: { message: string } };
      expect(body.error.message).toContain("temporarily unavailable");
    });
  });

  describe("POST /api/uploads/confirm", () => {
    it("requires auth", async () => {
      const response = await apiRequest(getServer().baseUrl, "/api/uploads/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          uploadType: "avatar",
          publicUrl: "https://assets.example.com/avatars/someone/file.jpg",
        }),
      });
      expect(response.status).toBe(401);
    });

    it("rejects a malformed publicUrl", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "upconf1");
      const response = await apiRequest(
        getServer().baseUrl,
        "/api/uploads/confirm",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ uploadType: "avatar", publicUrl: "not-a-url" }),
        },
        jar,
      );
      expect(response.status).toBe(400);
    });

    it("returns 503 (not a 500) when confirming while R2 is not configured", async () => {
      // isOwnedUploadPublicUrl() itself resolves R2 config to know the
      // expected public base URL — without R2_PUBLIC_URL configured it
      // can't validate ownership, so this must fail gracefully like
      // requestUpload's R2-not-configured branch, never surface as an
      // unhandled 500.
      const { jar, username } = await signUpTestUser(getServer().baseUrl, "upconf2");
      const response = await apiRequest(
        getServer().baseUrl,
        "/api/uploads/confirm",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            uploadType: "avatar",
            publicUrl: `https://assets.example.com/avatars/${username}/file.jpg`,
          }),
        },
        jar,
      );
      expect(response.status).toBe(503);
      const body = (await response.json()) as { error: { message: string } };
      expect(body.error.message).toContain("temporarily unavailable");
    });
  });

  describe("with R2 configured", () => {
    beforeAll(() => {
      // Presigning (getSignedUrl) computes a SigV4 signature locally and
      // never hits the network, so fake-but-well-formed credentials are
      // enough to exercise the real request/confirm flow offline. These
      // must be set before the first getConfig() call in this file's
      // process — r2/client.ts caches its config on first successful read.
      process.env.R2_ACCOUNT_ID = "test-account";
      process.env.R2_ACCESS_KEY_ID = "test-access-key";
      process.env.R2_SECRET_ACCESS_KEY = "test-secret-key";
      process.env.R2_BUCKET_NAME = "test-bucket";
      process.env.R2_PUBLIC_URL = "https://assets.test.local";
    });

    const getUserId = async (jar: Awaited<ReturnType<typeof signUpTestUser>>["jar"]) => {
      const response = await apiRequest(getServer().baseUrl, "/api/users/me", {}, jar);
      const body = (await response.json()) as { id: string };
      return body.id;
    };

    it("issues a signed upload URL scoped to the requesting user", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "upreq4");
      const userId = await getUserId(jar);

      const response = await apiRequest(
        getServer().baseUrl,
        "/api/uploads/request",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            uploadType: "avatar",
            contentType: "image/png",
            fileSizeBytes: 1024,
          }),
        },
        jar,
      );
      expect(response.status).toBe(200);
      const body = (await response.json()) as { signedUrl: string; publicUrl: string };
      expect(body.publicUrl).toStartWith(`https://assets.test.local/avatars/${userId}/`);
      expect(body.publicUrl).toEndWith(".png");
      expect(body.signedUrl).toStartWith(
        "https://test-bucket.test-account.r2.cloudflarestorage.com/",
      );
    });

    it("confirms and stores an upload owned by the requesting user", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "upconf3");
      const userId = await getUserId(jar);
      const publicUrl = `https://assets.test.local/avatars/${userId}/photo.png`;

      const response = await apiRequest(
        getServer().baseUrl,
        "/api/uploads/confirm",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ uploadType: "avatar", publicUrl }),
        },
        jar,
      );
      expect(response.status).toBe(200);
      const body = (await response.json()) as { avatarUrl: string };
      expect(body.avatarUrl).toBe(publicUrl);
    });

    it("accepts the legacy flat avatar path for confirming ownership", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "upconf4");
      const userId = await getUserId(jar);
      const publicUrl = `https://assets.test.local/avatars/${userId}.png`;

      const response = await apiRequest(
        getServer().baseUrl,
        "/api/uploads/confirm",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ uploadType: "avatar", publicUrl }),
        },
        jar,
      );
      expect(response.status).toBe(200);
    });

    it("rejects confirming an upload that belongs to a different user", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "upconf5");
      const victim = await signUpTestUser(getServer().baseUrl, "upvictim");
      const victimId = await getUserId(victim.jar);

      const response = await apiRequest(
        getServer().baseUrl,
        "/api/uploads/confirm",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            uploadType: "avatar",
            publicUrl: `https://assets.test.local/avatars/${victimId}/stolen.png`,
          }),
        },
        jar,
      );
      expect(response.status).toBe(400);
      const body = (await response.json()) as { error: { message: string } };
      expect(body.error.message).toContain("Invalid upload URL");
    });

    it("rejects confirming a URL whose origin doesn't match the configured R2 public URL", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "upconf6");
      const userId = await getUserId(jar);

      const response = await apiRequest(
        getServer().baseUrl,
        "/api/uploads/confirm",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            uploadType: "avatar",
            publicUrl: `https://evil.example.com/avatars/${userId}/photo.png`,
          }),
        },
        jar,
      );
      expect(response.status).toBe(400);
    });

    // Replaced avatars and a deleted account's uploads are removed from R2,
    // best-effort (#101). S3 calls are captured instead of sent.
    describe("cleanup", () => {
      let sendSpy: ReturnType<typeof spyOn> | null = null;
      const sent: unknown[] = [];

      const captureS3 = (respond: (command: unknown) => unknown = () => ({})) => {
        sendSpy = spyOn(S3Client.prototype, "send").mockImplementation((async (
          command: unknown,
        ) => {
          sent.push(command);
          return respond(command);
        }) as never);
      };

      afterEach(() => {
        sendSpy?.mockRestore();
        sendSpy = null;
        sent.length = 0;
      });

      const confirm = (jar: Awaited<ReturnType<typeof signUpTestUser>>["jar"], publicUrl: string) =>
        apiRequest(
          getServer().baseUrl,
          "/api/uploads/confirm",
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ uploadType: "avatar", publicUrl }),
          },
          jar,
        );

      const deletedKeys = () =>
        sent
          .filter((command) => command instanceof DeleteObjectCommand)
          .map((command) => (command as DeleteObjectCommand).input.Key);

      it("deletes the previous avatar once a new one is confirmed", async () => {
        captureS3();
        const { jar } = await signUpTestUser(getServer().baseUrl, "upclean1");
        const userId = await getUserId(jar);

        expect((await confirm(jar, `https://assets.test.local/avatars/${userId}/first.png`)).status).toBe(200);
        expect(deletedKeys()).toEqual([]);

        expect((await confirm(jar, `https://assets.test.local/avatars/${userId}/second.png`)).status).toBe(200);
        expect(deletedKeys()).toEqual([`avatars/${userId}/first.png`]);
      });

      it("still saves the new avatar when deleting the old one fails", async () => {
        const { jar } = await signUpTestUser(getServer().baseUrl, "upclean2");
        const userId = await getUserId(jar);
        expect((await confirm(jar, `https://assets.test.local/avatars/${userId}/first.png`)).status).toBe(200);

        captureS3(() => {
          throw new Error("R2 is down");
        });
        const response = await confirm(jar, `https://assets.test.local/avatars/${userId}/second.png`);
        expect(response.status).toBe(200);
        expect(((await response.json()) as { avatarUrl: string }).avatarUrl).toEndWith("/second.png");
      });

      it("deletes every upload of a deleted account, and only theirs", async () => {
        const { jar } = await signUpTestUser(getServer().baseUrl, "upclean3");
        const userId = await getUserId(jar);
        captureS3((command) =>
          command instanceof ListObjectsV2Command
            ? {
                Contents: [
                  { Key: `avatars/${userId}/current.png` },
                  { Key: `avatars/${userId}/never-confirmed.webp` },
                  { Key: `avatars/${userId}.png` },
                  { Key: `avatars/${userId}0/someone-else.png` },
                ],
              }
            : {},
        );

        const response = await apiRequest(getServer().baseUrl, "/api/auth/account", { method: "DELETE" }, jar);
        expect(response.status).toBeLessThan(300);

        const batch = sent.find((command) => command instanceof DeleteObjectsCommand) as
          | DeleteObjectsCommand
          | undefined;
        expect(batch?.input.Delete?.Objects?.map((object) => object.Key)).toEqual([
          `avatars/${userId}/current.png`,
          `avatars/${userId}/never-confirmed.webp`,
          `avatars/${userId}.png`,
        ]);
      });
    });
  });
});
