import type { Request, Response } from "express";
import { z } from "zod";
import { PostsService } from "./posts.service";
import { CreatePostSchema, PostCommentSchema } from "./dto/posts.dto";

export class PostsController {
  // GET /api/posts/:id
  static async getById(
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> {
    const post = await PostsService.findById(req.params.id);
    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }
    res.status(200).json(post);
  }

  // POST /api/posts
  static async create(req: Request, res: Response): Promise<void> {
    const parsed = CreatePostSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: z.flattenError(parsed.error) });
      return;
    }

    const post = await PostsService.create(req.user.id, parsed.data);
    res.status(201).json(post);
  }

  // DELETE /api/posts/:id
  static async remove(
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> {
    const deleted = await PostsService.delete(req.params.id, req.user.id);
    if (!deleted) {
      res.status(404).json({ error: "Post not found" });
      return;
    }
    res.status(200).json({ success: true });
  }

  // POST /api/posts/:id/like
  static async like(
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> {
    const result = await PostsService.like(req.user.id, req.params.id);
    res.status(200).json(result);
  }

  // DELETE /api/posts/:id/like
  static async unlike(
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> {
    const result = await PostsService.unlike(req.user.id, req.params.id);
    if (!result) {
      res.status(404).json({ error: "Like not found" });
      return;
    }
    res.status(200).json({ liked: false });
  }

  // GET /api/posts/:id/comments
  static async getComments(
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> {
    const comments = await PostsService.getComments(req.params.id);
    res.status(200).json(comments);
  }

  // POST /api/posts/:id/comments
  static async addComment(
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> {
    const parsed = PostCommentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: z.flattenError(parsed.error) });
      return;
    }

    const comment = await PostsService.addComment(
      req.user.id,
      req.params.id,
      parsed.data.content,
    );
    if (!comment) {
      res.status(404).json({ error: "Post not found" });
      return;
    }
    res.status(201).json(comment);
  }

  // DELETE /api/posts/comments/:commentId
  static async deleteComment(
    req: Request<{ commentId: string }>,
    res: Response,
  ): Promise<void> {
    const deleted = await PostsService.deleteComment(
      req.params.commentId,
      req.user.id,
    );
    if (!deleted) {
      res.status(404).json({ error: "Comment not found" });
      return;
    }
    res.status(200).json({ success: true });
  }
}
