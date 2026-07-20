import type { Request, Response } from "express";
import { sendNotFound, sendValidationError } from "../../commons/http/validation-response.helper";
import { AdminContentService } from "./admin-content.service";
import {
  AdminListContentQuerySchema,
  type AdminListContentQuery,
} from "./dto/admin-content.dto";

export class AdminContentController {
  static async listReviews(
    req: Request<{}, {}, {}, AdminListContentQuery>,
    res: Response,
  ): Promise<void> {
    const parsed = AdminListContentQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const reviews = await AdminContentService.listReviews(
      { username: parsed.data.username, movieId: parsed.data.movieId },
      parsed.data.limit ?? 20,
      parsed.data.offset ?? 0,
    );
    res.status(200).json(reviews);
  }

  static async deleteReview(req: Request<{ id: string }>, res: Response): Promise<void> {
    const deleted = await AdminContentService.deleteReview(req.params.id);
    if (!deleted) {
      sendNotFound(res, "Review not found");
      return;
    }
    res.status(200).json({ success: true });
  }

  static async listDiaryEntries(
    req: Request<{}, {}, {}, AdminListContentQuery>,
    res: Response,
  ): Promise<void> {
    const parsed = AdminListContentQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const entries = await AdminContentService.listDiaryEntries(
      { username: parsed.data.username, movieId: parsed.data.movieId },
      parsed.data.limit ?? 20,
      parsed.data.offset ?? 0,
    );
    res.status(200).json(entries);
  }

  static async deleteDiaryEntry(req: Request<{ id: string }>, res: Response): Promise<void> {
    const deleted = await AdminContentService.deleteDiaryEntry(req.params.id);
    if (!deleted) {
      sendNotFound(res, "Diary entry not found");
      return;
    }
    res.status(200).json({ success: true });
  }

  static async listPosts(
    req: Request<{}, {}, {}, AdminListContentQuery>,
    res: Response,
  ): Promise<void> {
    const parsed = AdminListContentQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const posts = await AdminContentService.listPosts(
      { username: parsed.data.username },
      parsed.data.limit ?? 20,
      parsed.data.offset ?? 0,
    );
    res.status(200).json(posts);
  }

  static async deletePost(req: Request<{ id: string }>, res: Response): Promise<void> {
    const deleted = await AdminContentService.deletePost(req.params.id);
    if (!deleted) {
      sendNotFound(res, "Post not found");
      return;
    }
    res.status(200).json({ success: true });
  }
}
