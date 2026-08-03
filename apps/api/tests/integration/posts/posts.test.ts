import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

describe("posts", () => {
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

  const createPost = async (jar: CookieJar, content = "Hello world") => {
    const response = await apiRequest(
      getServer().baseUrl,
      "/api/posts",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content }),
      },
      jar,
    );
    return { response, body: (await response.json()) as { id: string; content: string } };
  };

  describe("POST /api/posts (create)", () => {
    it("requires auth", async () => {
      const response = await apiRequest(getServer().baseUrl, "/api/posts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: "hi" }),
      });
      expect(response.status).toBe(401);
    });

    it("rejects empty content", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "pcempty");
      const { response } = await createPost(jar, "");
      expect(response.status).toBe(400);
    });

    it("rejects content over 250 chars", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "pclong");
      const { response } = await createPost(jar, "a".repeat(251));
      expect(response.status).toBe(400);
    });

    it("rejects mediaId without mediaType", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "pcmedia");
      const response = await apiRequest(
        getServer().baseUrl,
        "/api/posts",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ content: "hi", mediaId: 550 }),
        },
        jar,
      );
      expect(response.status).toBe(400);
    });

    it("creates a post and surfaces it via GET /api/posts/:id", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "pccreate");
      const { response, body } = await createPost(jar, "My first post");
      expect(response.status).toBe(201);
      expect(body.content).toBe("My first post");

      const getResponse = await apiRequest(getServer().baseUrl, `/api/posts/${body.id}`);
      expect(getResponse.status).toBe(200);
      const fetched = (await getResponse.json()) as {
        id: string;
        likeCount: number;
        author: { username: string };
      };
      expect(fetched.id).toBe(body.id);
      expect(fetched.likeCount).toBe(0);
      expect(fetched.author.username).toBeTruthy();
    });
  });

  it("returns 404 for a non-existent post", async () => {
    const response = await apiRequest(
      getServer().baseUrl,
      "/api/posts/00000000-0000-0000-0000-000000000000",
    );
    expect(response.status).toBe(404);
  });

  describe("PUT/DELETE /api/posts/:id (ownership)", () => {
    it("hides existence of another user's post on update/delete (404, not 403)", async () => {
      const owner = await signUpTestUser(getServer().baseUrl, "powner1");
      const intruder = await signUpTestUser(getServer().baseUrl, "pintr1");
      const { body: post } = await createPost(owner.jar, "Owned post");

      const forbiddenUpdate = await apiRequest(
        getServer().baseUrl,
        `/api/posts/${post.id}`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ content: "Hijacked" }),
        },
        intruder.jar,
      );
      expect(forbiddenUpdate.status).toBe(404);

      const forbiddenDelete = await apiRequest(
        getServer().baseUrl,
        `/api/posts/${post.id}`,
        { method: "DELETE" },
        intruder.jar,
      );
      expect(forbiddenDelete.status).toBe(404);
    });

    it("allows the owner to update and delete their post", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "powner2");
      const { body: post } = await createPost(jar, "Editable post");

      const updateResponse = await apiRequest(
        getServer().baseUrl,
        `/api/posts/${post.id}`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ content: "Edited" }),
        },
        jar,
      );
      expect(updateResponse.status).toBe(200);
      const updated = (await updateResponse.json()) as { content: string };
      expect(updated.content).toBe("Edited");

      const deleteResponse = await apiRequest(
        getServer().baseUrl,
        `/api/posts/${post.id}`,
        { method: "DELETE" },
        jar,
      );
      expect(deleteResponse.status).toBe(200);

      const afterDelete = await apiRequest(getServer().baseUrl, `/api/posts/${post.id}`);
      expect(afterDelete.status).toBe(404);
    });
  });

  describe("like/unlike", () => {
    it("requires auth for like and unlike", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "plikeauth");
      const { body: post } = await createPost(jar, "Likeable post");

      const likeResponse = await apiRequest(getServer().baseUrl, `/api/posts/${post.id}/like`, {
        method: "POST",
      });
      expect(likeResponse.status).toBe(401);

      const unlikeResponse = await apiRequest(
        getServer().baseUrl,
        `/api/posts/${post.id}/like`,
        { method: "DELETE" },
      );
      expect(unlikeResponse.status).toBe(401);
    });

    it("likes a post, is idempotent, then unlikes it", async () => {
      const author = await signUpTestUser(getServer().baseUrl, "plikeauthor");
      const liker = await signUpTestUser(getServer().baseUrl, "pliker");
      const { body: post } = await createPost(author.jar, "Likeable post 2");

      const firstLike = await apiRequest(
        getServer().baseUrl,
        `/api/posts/${post.id}/like`,
        { method: "POST" },
        liker.jar,
      );
      expect(firstLike.status).toBe(200);
      const firstBody = (await firstLike.json()) as { liked: boolean; wasNew: boolean };
      expect(firstBody).toEqual({ liked: true, wasNew: true });

      const secondLike = await apiRequest(
        getServer().baseUrl,
        `/api/posts/${post.id}/like`,
        { method: "POST" },
        liker.jar,
      );
      expect(secondLike.status).toBe(200);
      const secondBody = (await secondLike.json()) as { liked: boolean; wasNew: boolean };
      expect(secondBody).toEqual({ liked: true, wasNew: false });

      const detail = await apiRequest(getServer().baseUrl, `/api/posts/${post.id}`);
      const detailBody = (await detail.json()) as { likeCount: number };
      expect(detailBody.likeCount).toBe(1);

      const unlikeResponse = await apiRequest(
        getServer().baseUrl,
        `/api/posts/${post.id}/like`,
        { method: "DELETE" },
        liker.jar,
      );
      expect(unlikeResponse.status).toBe(200);

      const afterUnlike = await apiRequest(getServer().baseUrl, `/api/posts/${post.id}`);
      const afterUnlikeBody = (await afterUnlike.json()) as { likeCount: number };
      expect(afterUnlikeBody.likeCount).toBe(0);
    });

    it("returns 404 when unliking a post that was never liked", async () => {
      const author = await signUpTestUser(getServer().baseUrl, "pnolikeauthor");
      const other = await signUpTestUser(getServer().baseUrl, "pnoliker");
      const { body: post } = await createPost(author.jar, "Never liked");

      const response = await apiRequest(
        getServer().baseUrl,
        `/api/posts/${post.id}/like`,
        { method: "DELETE" },
        other.jar,
      );
      expect(response.status).toBe(404);
    });
  });

  describe("comments", () => {
    it("requires auth to add a comment", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "pcommentauth");
      const { body: post } = await createPost(jar, "Commentable post");

      const response = await apiRequest(getServer().baseUrl, `/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: "Nice!" }),
      });
      expect(response.status).toBe(401);
    });

    it("rejects empty comment content", async () => {
      const author = await signUpTestUser(getServer().baseUrl, "pcemptyauthor");
      const { body: post } = await createPost(author.jar, "Post for empty comment");

      const response = await apiRequest(
        getServer().baseUrl,
        `/api/posts/${post.id}/comments`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ content: "" }),
        },
        author.jar,
      );
      expect(response.status).toBe(400);
    });

    it("returns 404 when commenting on a non-existent post", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "pcghost");
      const response = await apiRequest(
        getServer().baseUrl,
        "/api/posts/00000000-0000-0000-0000-000000000000/comments",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ content: "Nice!" }),
        },
        jar,
      );
      expect(response.status).toBe(404);
    });

    it("adds a comment and surfaces it via GET /api/posts/:id/comments", async () => {
      const author = await signUpTestUser(getServer().baseUrl, "pcaddauthor");
      const commenter = await signUpTestUser(getServer().baseUrl, "pcaddcommenter");
      const { body: post } = await createPost(author.jar, "Post to comment on");

      const addResponse = await apiRequest(
        getServer().baseUrl,
        `/api/posts/${post.id}/comments`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ content: "Great post!" }),
        },
        commenter.jar,
      );
      expect(addResponse.status).toBe(201);
      const added = (await addResponse.json()) as { id: string; content: string };
      expect(added.content).toBe("Great post!");

      const listResponse = await apiRequest(
        getServer().baseUrl,
        `/api/posts/${post.id}/comments`,
      );
      expect(listResponse.status).toBe(200);
      const list = (await listResponse.json()) as Array<{
        comment: { id: string; content: string };
        authorUsername: string;
      }>;
      expect(list.some((c) => c.comment.id === added.id)).toBe(true);
    });

    it("scopes comment ownership to the commenter, not the post owner", async () => {
      // Post-owner and comment-owner are different actors: deleting a
      // comment on your own post that someone else wrote must not be
      // allowed just because you own the post — /comments/:commentId
      // ownership is scoped strictly to the comment's own userId.
      const postOwner = await signUpTestUser(getServer().baseUrl, "pcownerpost");
      const commenter = await signUpTestUser(getServer().baseUrl, "pcownercomment");
      const { body: post } = await createPost(postOwner.jar, "Ownership boundary post");

      const addResponse = await apiRequest(
        getServer().baseUrl,
        `/api/posts/${post.id}/comments`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ content: "Commenter's own comment" }),
        },
        commenter.jar,
      );
      const comment = (await addResponse.json()) as { id: string };

      const postOwnerDeleteAttempt = await apiRequest(
        getServer().baseUrl,
        `/api/posts/comments/${comment.id}`,
        { method: "DELETE" },
        postOwner.jar,
      );
      expect(postOwnerDeleteAttempt.status).toBe(404);

      const postOwnerUpdateAttempt = await apiRequest(
        getServer().baseUrl,
        `/api/posts/comments/${comment.id}`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ content: "Hijacked comment" }),
        },
        postOwner.jar,
      );
      expect(postOwnerUpdateAttempt.status).toBe(404);

      const commenterUpdate = await apiRequest(
        getServer().baseUrl,
        `/api/posts/comments/${comment.id}`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ content: "Edited by rightful owner" }),
        },
        commenter.jar,
      );
      expect(commenterUpdate.status).toBe(200);

      const commenterDelete = await apiRequest(
        getServer().baseUrl,
        `/api/posts/comments/${comment.id}`,
        { method: "DELETE" },
        commenter.jar,
      );
      expect(commenterDelete.status).toBe(200);

      const listAfterDelete = await apiRequest(
        getServer().baseUrl,
        `/api/posts/${post.id}/comments`,
      );
      const listBody = (await listAfterDelete.json()) as Array<{ comment: { id: string } }>;
      expect(listBody.some((c) => c.comment.id === comment.id)).toBe(false);
    });

    it("does not let the /comments/:commentId route be swallowed by /:id/comments", async () => {
      const author = await signUpTestUser(getServer().baseUrl, "prouteorder");
      const { body: post } = await createPost(author.jar, "Route ordering post");

      const addResponse = await apiRequest(
        getServer().baseUrl,
        `/api/posts/${post.id}/comments`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ content: "Route order comment" }),
        },
        author.jar,
      );
      const comment = (await addResponse.json()) as { id: string };

      const deleteResponse = await apiRequest(
        getServer().baseUrl,
        `/api/posts/comments/${comment.id}`,
        { method: "DELETE" },
        author.jar,
      );
      expect(deleteResponse.status).toBe(200);
    });
  });
});
