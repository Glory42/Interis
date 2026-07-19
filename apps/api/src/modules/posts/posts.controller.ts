import type { Context } from "hono";
import type { AppEnv } from "../../infrastructure/http/hono-context.types";
import { sendNotFound, sendValidationError } from "../../commons/http/validation-response.hono";
import { PostsService } from "./posts.service";
import { CreatePostSchema, PostCommentSchema, UpdatePostSchema } from "./dto/posts.dto";

export class PostsController {
  // GET /api/posts/:id
  static async getById(c: Context): Promise<Response> {
    const post = await PostsService.findById(c.req.param("id") as string);
    if (!post) {
      return sendNotFound(c, "Post not found");
    }
    return c.json(post, 200);
  }

  // POST /api/posts
  static async create(c: Context<AppEnv>): Promise<Response> {
    const parsed = CreatePostSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    const post = await PostsService.create(c.get("user").id, parsed.data);
    return c.json(post, 201);
  }

  // DELETE /api/posts/:id
  static async remove(c: Context<AppEnv>): Promise<Response> {
    const deleted = await PostsService.delete(c.req.param("id") as string, c.get("user").id);
    if (!deleted) {
      return sendNotFound(c, "Post not found");
    }
    return c.json({ success: true }, 200);
  }

  // PUT /api/posts/:id
  static async update(c: Context<AppEnv>): Promise<Response> {
    const parsed = UpdatePostSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    const updated = await PostsService.update(
      c.req.param("id") as string,
      c.get("user").id,
      parsed.data,
    );
    if (!updated) {
      return sendNotFound(c, "Post not found");
    }

    return c.json(updated, 200);
  }

  // POST /api/posts/:id/like
  static async like(c: Context<AppEnv>): Promise<Response> {
    const result = await PostsService.like(c.get("user").id, c.req.param("id") as string);
    return c.json(result, 200);
  }

  // DELETE /api/posts/:id/like
  static async unlike(c: Context<AppEnv>): Promise<Response> {
    const result = await PostsService.unlike(c.get("user").id, c.req.param("id") as string);
    if (!result) {
      return sendNotFound(c, "Like not found");
    }
    return c.json({ liked: false }, 200);
  }

  // GET /api/posts/:id/comments
  static async getComments(c: Context): Promise<Response> {
    const comments = await PostsService.getComments(c.req.param("id") as string);
    return c.json(comments, 200);
  }

  // POST /api/posts/:id/comments
  static async addComment(c: Context<AppEnv>): Promise<Response> {
    const parsed = PostCommentSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    const comment = await PostsService.addComment(
      c.get("user").id,
      c.req.param("id") as string,
      parsed.data.content,
    );
    if (!comment) {
      return sendNotFound(c, "Post not found");
    }
    return c.json(comment, 201);
  }

  // DELETE /api/posts/comments/:commentId
  static async deleteComment(c: Context<AppEnv>): Promise<Response> {
    const deleted = await PostsService.deleteComment(
      c.req.param("commentId") as string,
      c.get("user").id,
    );
    if (!deleted) {
      return sendNotFound(c, "Comment not found");
    }
    return c.json({ success: true }, 200);
  }
}
