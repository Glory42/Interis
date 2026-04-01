import type { Request, Response } from "express";
import { resolveViewerUserIdFromHeaders } from "../../commons/auth/session-resolver.helper";
import { sendValidationError } from "../../commons/http/validation-response.helper";
import { ReviewsService } from "./reviews.service";
import {
  CreateReviewSchema,
  ReviewCommentSchema,
  UpdateReviewSchema,
} from "./dto/reviews.dto";

export class ReviewsController {
  static async getById(
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> {
    const review = await ReviewsService.findById(req.params.id);
    if (!review) {
      res.status(404).json({ error: "Review not found" });
      return;
    }
    res.status(200).json(review);
  }

  static async create(req: Request, res: Response): Promise<void> {
    const parsed = CreateReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const result = await ReviewsService.create(req.user.id, parsed.data);
    res.status(201).json(result);
  }

  static async update(
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> {
    const parsed = UpdateReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const updated = await ReviewsService.update(
      req.params.id,
      req.user.id,
      parsed.data,
    );
    if (!updated) {
      res.status(404).json({ error: "Review not found" });
      return;
    }
    res.status(200).json(updated);
  }

  static async remove(
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> {
    const deleted = await ReviewsService.delete(req.params.id, req.user.id);
    if (!deleted) {
      res.status(404).json({ error: "Review not found" });
      return;
    }
    res.status(200).json({ success: true });
  }

  static async getComments(
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> {
    const viewerUserId = await resolveViewerUserIdFromHeaders(req.headers);
    const comments = await ReviewsService.getComments(req.params.id, viewerUserId);
    res.status(200).json(comments);
  }

  static async addComment(
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> {
    const parsed = ReviewCommentSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const comment = await ReviewsService.addComment(
      req.user.id,
      req.params.id,
      parsed.data.content,
    );
    if (!comment) {
      res.status(404).json({ error: "Review not found" });
      return;
    }
    res.status(201).json(comment);
  }

  static async deleteComment(
    req: Request<{ commentId: string }>,
    res: Response,
  ): Promise<void> {
    const deleted = await ReviewsService.deleteComment(
      req.params.commentId,
      req.user.id,
    );
    if (!deleted) {
      res.status(404).json({ error: "Comment not found" });
      return;
    }
    res.status(200).json({ success: true });
  }

  static async likeReview(
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> {
    const result = await ReviewsService.likeReview(req.user.id, req.params.id);
    res.status(200).json(result);
  }

  static async unlikeReview(
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> {
    const result = await ReviewsService.unlikeReview(
      req.user.id,
      req.params.id,
    );
    if (!result) {
      res.status(404).json({ error: "Like not found" });
      return;
    }
    res.status(200).json({ liked: false });
  }
}
