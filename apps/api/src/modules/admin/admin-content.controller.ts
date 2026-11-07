import type { Request, Response } from "express";
import { sendNotFound, sendValidationError } from "../../commons/http/validation-response.helper";
import { AdminContentService } from "./admin-content.service";
import {
  AdminCommentParamsSchema,
  AdminDeleteLogQuerySchema,
  AdminListCommentsQuerySchema,
  AdminListContentQuerySchema,
  AdminListLogsQuerySchema,
  type AdminListCommentsQuery,
  type AdminListContentQuery,
  type AdminListLogsQuery,
} from "./dto/admin-content.dto";
import { AdminAuditService } from "./admin-audit.service";

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
    await AdminAuditService.record(req.user, { action: "review.delete", targetType: "review", targetId: req.params.id });
    res.status(200).json({ success: true });
  }

  static async listDiaryEntries(
    req: Request<{}, {}, {}, AdminListLogsQuery>,
    res: Response,
  ): Promise<void> {
    const parsed = AdminListLogsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const { username, movieId, seriesId, mediaType } = parsed.data;
    const entries = await AdminContentService.listDiaryEntries(
      { username, movieId, seriesId, mediaType },
      parsed.data.limit ?? 20,
      parsed.data.offset ?? 0,
    );
    res.status(200).json(entries);
  }

  static async deleteDiaryEntry(req: Request<{ id: string }>, res: Response): Promise<void> {
    const parsed = AdminDeleteLogQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }
    const deleted = await AdminContentService.deleteDiaryEntry(req.params.id, parsed.data.mediaType);
    if (!deleted) {
      sendNotFound(res, "Diary entry not found");
      return;
    }
    const targetType = deleted.mediaType === "tv" ? "serial_diary_entry" : "diary_entry";
    await AdminAuditService.record(req.user, { action: "diary_entry.delete", targetType, targetId: req.params.id });
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
    await AdminAuditService.record(req.user, { action: "post.delete", targetType: "post", targetId: req.params.id });
    res.status(200).json({ success: true });
  }

  // GET /api/admin/comments — comments on reviews and posts, newest first.
  static async listComments(req: Request<{}, {}, {}, AdminListCommentsQuery>, res: Response): Promise<void> {
    const parsed = AdminListCommentsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }
    res.status(200).json(await AdminContentService.listComments(parsed.data.limit ?? 20, parsed.data.offset ?? 0));
  }

  // DELETE /api/admin/comments/:kind/:id
  static async deleteComment(req: Request<{ kind: string; id: string }>, res: Response): Promise<void> {
    const parsed = AdminCommentParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }
    const deleted = await AdminContentService.deleteComment(parsed.data.kind, parsed.data.id);
    if (!deleted) {
      sendNotFound(res, "Comment not found");
      return;
    }
    await AdminAuditService.record(req.user, {
      action: "comment.delete",
      targetType: parsed.data.kind === "review" ? "comment" : "post_comment",
      targetId: parsed.data.id,
    });
    res.status(200).json({ success: true });
  }
}
