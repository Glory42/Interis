import type { Context } from "hono";
import type { AppEnv } from "../../infrastructure/http/hono-context.types";
import { resolveViewerUserIdFromHonoContext } from "../../commons/auth/session-resolver.hono";
import {
  sendErrorForStatus,
  sendNotFound,
  sendValidationError,
} from "../../commons/http/validation-response.hono";
import {
  AddListItemSchema,
  CreateListSchema,
  ReorderListItemsSchema,
  UpdateListSchema,
} from "./dto/lists.dto";
import { ListsService } from "./lists.service";

export class ListsController {
  // GET /api/lists/:id
  static async getById(c: Context): Promise<Response> {
    const viewerUserId = await resolveViewerUserIdFromHonoContext(c);
    const list = await ListsService.getListDetail(c.req.param("id") as string, viewerUserId);

    if (!list) {
      return sendNotFound(c, "List not found");
    }

    return c.json(list, 200);
  }

  // POST /api/lists
  static async create(c: Context<AppEnv>): Promise<Response> {
    const parsed = CreateListSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    const list = await ListsService.createList(c.get("user").id, parsed.data);
    return c.json(list, 201);
  }

  // PATCH /api/lists/:id
  static async update(c: Context<AppEnv>): Promise<Response> {
    const parsed = UpdateListSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    const result = await ListsService.updateList(
      c.req.param("id") as string,
      c.get("user").id,
      parsed.data,
    );

    if ("error" in result) {
      return sendErrorForStatus(c, result.status, result.error);
    }

    return c.json(result, 200);
  }

  // DELETE /api/lists/:id
  static async remove(c: Context<AppEnv>): Promise<Response> {
    const result = await ListsService.deleteList(c.req.param("id") as string, c.get("user").id);

    if (result && "error" in result) {
      return sendErrorForStatus(c, result.status, result.error);
    }

    return c.json({ success: true }, 200);
  }

  // POST /api/lists/:id/items
  static async addItem(c: Context<AppEnv>): Promise<Response> {
    const parsed = AddListItemSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    const result = await ListsService.addItem(
      c.req.param("id") as string,
      c.get("user").id,
      parsed.data.tmdbId,
      parsed.data.itemType,
    );

    if ("error" in result) {
      return sendErrorForStatus(c, result.status, result.error);
    }

    return c.json(result, 201);
  }

  // DELETE /api/lists/:id/items/:itemId
  static async removeItem(c: Context<AppEnv>): Promise<Response> {
    const result = await ListsService.removeItem(
      c.req.param("id") as string,
      c.get("user").id,
      c.req.param("itemId") as string,
    );

    if ("error" in result) {
      return sendErrorForStatus(c, result.status, result.error);
    }

    return c.json(result, 200);
  }

  // POST /api/lists/:id/like
  static async like(c: Context<AppEnv>): Promise<Response> {
    const result = await ListsService.likeList(c.req.param("id") as string, c.get("user").id);
    if ("error" in result) {
      return sendErrorForStatus(c, result.status, result.error);
    }
    return c.json(result, 200);
  }

  // DELETE /api/lists/:id/like
  static async unlike(c: Context<AppEnv>): Promise<Response> {
    const result = await ListsService.unlikeList(c.req.param("id") as string, c.get("user").id);
    return c.json(result, 200);
  }

  // PATCH /api/lists/:id/reorder
  static async reorder(c: Context<AppEnv>): Promise<Response> {
    const parsed = ReorderListItemsSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    const result = await ListsService.reorderItems(
      c.req.param("id") as string,
      c.get("user").id,
      parsed.data.items,
    );

    if ("error" in result) {
      return sendErrorForStatus(c, result.status, result.error);
    }

    return c.json(result, 200);
  }
}
