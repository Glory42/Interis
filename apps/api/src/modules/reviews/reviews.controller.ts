import type { Context } from "hono";
import type { AppEnv } from "../../infrastructure/http/hono-context.types";
import { sendNotFound, sendValidationError } from "../../commons/http/validation-response.hono";
import { ReviewsService } from "./reviews.service";
import {
  CreateReviewSchema,
  ReviewCommentSchema,
  UpdateReviewSchema,
} from "./dto/reviews.dto";

export class ReviewsController {
  static async getById(c: Context): Promise<Response> {
    const review = await ReviewsService.findById(c.req.param("id") as string);
    if (!review) {
      return sendNotFound(c, "Review not found");
    }
    return c.json(review, 200);
  }

  static async create(c: Context<AppEnv>): Promise<Response> {
    const parsed = CreateReviewSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    const result = await ReviewsService.create(c.get("user").id, parsed.data);
    return c.json(result, 201);
  }

  static async update(c: Context<AppEnv>): Promise<Response> {
    const parsed = UpdateReviewSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    const updated = await ReviewsService.update(
      c.req.param("id") as string,
      c.get("user").id,
      parsed.data,
    );
    if (!updated) {
      return sendNotFound(c, "Review not found");
    }
    return c.json(updated, 200);
  }

  static async remove(c: Context<AppEnv>): Promise<Response> {
    const deleted = await ReviewsService.delete(c.req.param("id") as string, c.get("user").id);
    if (!deleted) {
      return sendNotFound(c, "Review not found");
    }
    return c.json({ success: true }, 200);
  }

  static async getComments(c: Context): Promise<Response> {
    const comments = await ReviewsService.getComments(c.req.param("id") as string);
    return c.json(comments, 200);
  }

  static async addComment(c: Context<AppEnv>): Promise<Response> {
    const parsed = ReviewCommentSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    const comment = await ReviewsService.addComment(
      c.get("user").id,
      c.req.param("id") as string,
      parsed.data.content,
    );
    if (!comment) {
      return sendNotFound(c, "Review not found");
    }
    return c.json(comment, 201);
  }

  static async deleteComment(c: Context<AppEnv>): Promise<Response> {
    const deleted = await ReviewsService.deleteComment(
      c.req.param("commentId") as string,
      c.get("user").id,
    );
    if (!deleted) {
      return sendNotFound(c, "Comment not found");
    }
    return c.json({ success: true }, 200);
  }

  static async likeReview(c: Context<AppEnv>): Promise<Response> {
    const result = await ReviewsService.likeReview(c.get("user").id, c.req.param("id") as string);
    return c.json(result, 200);
  }

  static async unlikeReview(c: Context<AppEnv>): Promise<Response> {
    const result = await ReviewsService.unlikeReview(
      c.get("user").id,
      c.req.param("id") as string,
    );
    if (!result) {
      return sendNotFound(c, "Like not found");
    }
    return c.json({ liked: false }, 200);
  }
}
