import type { Request, Response } from "express";
import { resolveViewerUserIdFromHeaders } from "../../commons/auth/session-resolver.helper";
import { sendBadRequest, sendValidationError } from "../../commons/http/validation-response.helper";
import { BooksService } from "./books.service";
import {
  SearchBooksQuerySchema,
  BooksArchiveQuerySchema,
  BookDetailQuerySchema,
  CreateBookLogSchema,
  UpdateBookLogSchema,
  UpdateBookInteractionSchema,
  normalizeBooksArchiveQuery,
  normalizeBookDetailQuery,
  parseVolumeIdParam,
  type SearchBooksQuery,
  type BookDetailQuery,
} from "./dto/books.dto";

export class BooksController {
  static async search(
    req: Request<{}, {}, {}, SearchBooksQuery>,
    res: Response,
  ): Promise<void> {
    const parsed = SearchBooksQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }
    const results = await BooksService.search(parsed.data.query, parsed.data.language);
    res.status(200).json(results);
  }

  static async getByVolumeId(req: Request<{ volumeId: string }>, res: Response): Promise<void> {
    const volumeId = parseVolumeIdParam(req.params.volumeId);
    if (!volumeId) {
      sendBadRequest(res, "Invalid book ID");
      return;
    }
    const book = await BooksService.findOrCreate(volumeId);
    if (!book) {
      res.status(404).json({ error: "Book not found" });
      return;
    }
    res.status(200).json(book);
  }

  static async getDetailByVolumeId(
    req: Request<{ volumeId: string }, {}, {}, BookDetailQuery>,
    res: Response,
  ): Promise<void> {
    const volumeId = parseVolumeIdParam(req.params.volumeId);
    if (!volumeId) {
      sendBadRequest(res, "Invalid book ID");
      return;
    }
    const viewerUserId = await resolveViewerUserIdFromHeaders(req.headers);
    const detail = await BooksService.getDetail({
      volumeId,
      viewerUserId,
      reviewsSort: normalizeBookDetailQuery(req.query).reviewsSort,
    });
    if (!detail) {
      res.status(404).json({ error: "Book not found" });
      return;
    }
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(detail);
  }

  static async getArchive(
    req: Request<{}, {}, {}, Record<string, string>>,
    res: Response,
  ): Promise<void> {
    const viewerUserId = await resolveViewerUserIdFromHeaders(req.headers);
    const archive = await BooksService.getArchive({
      ...normalizeBooksArchiveQuery(req.query),
      viewerUserId,
    });
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(archive);
  }

  static async getLogsByVolumeId(req: Request<{ volumeId: string }>, res: Response): Promise<void> {
    const volumeId = parseVolumeIdParam(req.params.volumeId);
    if (!volumeId) {
      sendBadRequest(res, "Invalid book ID");
      return;
    }
    const logs = await BooksService.getLogsByVolumeId(volumeId);
    if (logs === null) {
      res.status(404).json({ error: "Book not found" });
      return;
    }
    res.status(200).json(logs);
  }

  static async getInteraction(req: Request<{ volumeId: string }>, res: Response): Promise<void> {
    const volumeId = parseVolumeIdParam(req.params.volumeId);
    if (!volumeId) {
      sendBadRequest(res, "Invalid book ID");
      return;
    }
    const interaction = await BooksService.getInteraction(req.user.id, volumeId);
    res.status(200).json(interaction);
  }

  static async updateInteraction(req: Request<{ volumeId: string }>, res: Response): Promise<void> {
    const volumeId = parseVolumeIdParam(req.params.volumeId);
    if (!volumeId) {
      sendBadRequest(res, "Invalid book ID");
      return;
    }
    const parsed = UpdateBookInteractionSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }
    const result = await BooksService.updateInteraction(req.user.id, volumeId, parsed.data);
    res.status(200).json(result);
  }

  static async createLog(req: Request<{ volumeId: string }>, res: Response): Promise<void> {
    const volumeId = parseVolumeIdParam(req.params.volumeId);
    if (!volumeId) {
      sendBadRequest(res, "Invalid book ID");
      return;
    }
    const parsed = CreateBookLogSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }
    const result = await BooksService.createLog(req.user.id, volumeId, parsed.data);
    if (!result) {
      res.status(404).json({ error: "Book not found" });
      return;
    }
    res.status(201).json(result);
  }

  static async getMyLogs(req: Request, res: Response): Promise<void> {
    const logs = await BooksService.getMyLogs(req.user.id);
    res.status(200).json(logs);
  }

  static async updateLog(req: Request<{ id: string }>, res: Response): Promise<void> {
    const parsed = UpdateBookLogSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }
    const updated = await BooksService.updateLog(req.params.id, req.user.id, parsed.data);
    if (!updated) {
      res.status(404).json({ error: "Log not found" });
      return;
    }
    res.status(200).json(updated);
  }

  static async deleteLog(req: Request<{ id: string }>, res: Response): Promise<void> {
    const deleted = await BooksService.deleteLog(req.params.id, req.user.id);
    if (!deleted) {
      res.status(404).json({ error: "Log not found" });
      return;
    }
    res.status(200).json({ success: true });
  }
}
