import type { Request, Response } from "express";
import { resolveViewerUserIdFromHeaders } from "../../commons/auth/session-resolver.helper";
import {
  sendErrorForStatus,
  sendNotFound,
  sendValidationError,
} from "../../commons/http/validation-response.helper";
import {
  AddListItemSchema,
  CreateListSchema,
  InviteListCollaboratorSchema,
  ReorderListItemsSchema,
  UpdateListItemNoteSchema,
  UpdateListSchema,
} from "./dto/lists.dto";
import { ListsService } from "./lists.service";

export class ListsController {
  // GET /api/lists/:id
  static async getById(
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> {
    const viewerUserId = await resolveViewerUserIdFromHeaders(req.headers);
    const list = await ListsService.getListDetail(req.params.id, viewerUserId);

    if (!list) {
      sendNotFound(res, "List not found");
      return;
    }

    res.status(200).json(list);
  }

  // POST /api/lists
  static async create(req: Request, res: Response): Promise<void> {
    const parsed = CreateListSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const list = await ListsService.createList(req.user.id, parsed.data);
    res.status(201).json(list);
  }

  // PATCH /api/lists/:id
  static async update(
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> {
    const parsed = UpdateListSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const result = await ListsService.updateList(req.params.id, req.user.id, parsed.data);

    if ("error" in result) {
      sendErrorForStatus(res, result.status, result.error);
      return;
    }

    res.status(200).json(result);
  }

  // DELETE /api/lists/:id
  static async remove(
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> {
    const result = await ListsService.deleteList(req.params.id, req.user.id);

    if (result && "error" in result) {
      sendErrorForStatus(res, result.status, result.error);
      return;
    }

    res.status(200).json({ success: true });
  }

  // POST /api/lists/:id/items
  static async addItem(
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> {
    const parsed = AddListItemSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const result = await ListsService.addItem(
      req.params.id,
      req.user.id,
      parsed.data.tmdbId,
      parsed.data.itemType,
    );

    if ("error" in result) {
      sendErrorForStatus(res, result.status, result.error);
      return;
    }

    res.status(201).json(result);
  }

  // DELETE /api/lists/:id/items/:itemId
  static async removeItem(
    req: Request<{ id: string; itemId: string }>,
    res: Response,
  ): Promise<void> {
    const result = await ListsService.removeItem(
      req.params.id,
      req.user.id,
      req.params.itemId,
    );

    if ("error" in result) {
      sendErrorForStatus(res, result.status, result.error);
      return;
    }

    res.status(200).json(result);
  }

  // POST /api/lists/:id/like
  static async like(req: Request<{ id: string }>, res: Response): Promise<void> {
    const result = await ListsService.likeList(req.params.id, req.user.id);
    if ("error" in result) {
      sendErrorForStatus(res, result.status, result.error);
      return;
    }
    res.status(200).json(result);
  }

  // DELETE /api/lists/:id/like
  static async unlike(req: Request<{ id: string }>, res: Response): Promise<void> {
    const result = await ListsService.unlikeList(req.params.id, req.user.id);
    res.status(200).json(result);
  }

  // PATCH /api/lists/:id/reorder
  static async reorder(
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> {
    const parsed = ReorderListItemsSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const result = await ListsService.reorderItems(
      req.params.id,
      req.user.id,
      parsed.data.items,
    );

    if ("error" in result) {
      sendErrorForStatus(res, result.status, result.error);
      return;
    }

    res.status(200).json(result);
  }

  // PATCH /api/lists/:id/items/:itemId
  static async updateItemNote(
    req: Request<{ id: string; itemId: string }>,
    res: Response,
  ): Promise<void> {
    const parsed = UpdateListItemNoteSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const result = await ListsService.updateItemNote(req.params.id, req.user.id, req.params.itemId, parsed.data.note);
    if ("error" in result) {
      sendErrorForStatus(res, result.status, result.error);
      return;
    }

    res.status(200).json(result);
  }

  // POST /api/lists/:id/collaborators
  static async inviteCollaborator(req: Request<{ id: string }>, res: Response): Promise<void> {
    const parsed = InviteListCollaboratorSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const result = await ListsService.inviteCollaborator(req.params.id, req.user.id, parsed.data.username);
    if ("error" in result) {
      sendErrorForStatus(res, result.status, result.error);
      return;
    }

    res.status(201).json(result);
  }

  // POST /api/lists/:id/collaborators/accept
  static async acceptInvite(req: Request<{ id: string }>, res: Response): Promise<void> {
    const result = await ListsService.acceptInvite(req.params.id, req.user.id);
    if ("error" in result) {
      sendErrorForStatus(res, result.status, result.error);
      return;
    }

    res.status(200).json(result);
  }

  // DELETE /api/lists/:id/collaborators/:userId (remove, decline or leave)
  static async removeCollaborator(
    req: Request<{ id: string; userId: string }>,
    res: Response,
  ): Promise<void> {
    const result = await ListsService.removeCollaborator(req.params.id, req.user.id, req.params.userId);
    if ("error" in result) {
      sendErrorForStatus(res, result.status, result.error);
      return;
    }

    res.status(200).json(result);
  }
}
