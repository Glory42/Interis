import { FilmsCacheService } from "../../films/services/films-cache.service";
import { TvCacheService } from "../../tv/services/tv-cache.service";
import { ActivityRecorder } from "../../social/services/activity-recorder.service";
import { MAX_LIST_ITEMS } from "../constants/lists.constants";
import type { CreateListDto, UpdateListDto } from "../dto/lists.dto";
import { canViewList } from "../helpers/list-access.policy";
import { ListsReadRepository } from "../repositories/lists-read.repository";
import { ListsWriteRepository } from "../repositories/lists-write.repository";
import { NotificationsService } from "../../notifications/notifications.service";
import { isUuid } from "../../../commons/helpers/uuid.helper";
import { removalOwnerId, type ContentRemoval } from "../../../commons/types/content-removal.types";
import type { ListServiceError } from "../types/lists-service.types";
import { ListAccessService } from "./list-access.service";


export class ListsWriteService {
  static async createList(userId: string, data: CreateListDto) {
    const list = await ListsWriteRepository.create({
      userId,
      title: data.title,
      description: data.description,
      isPublic: data.isPublic,
      isRanked: data.isRanked,
    });

    if (!list) {
      throw new Error("Failed to create list");
    }

    await ActivityRecorder.record({
      userId,
      type: "created_list",
      entityId: list.id,
      metadata: { title: list.title },
    });

    return list;
  }

  static async updateList(
    listId: string,
    userId: string,
    data: UpdateListDto,
  ): Promise<NonNullable<Awaited<ReturnType<typeof ListsWriteRepository.update>>> | ListServiceError> {
    const access = await ListAccessService.requireManager(listId, userId);
    if ("error" in access) return access;

    const updated = await ListsWriteRepository.update(listId, data);

    if (!updated) {
      return { error: "List not found", status: 404 };
    }

    // The feed shows the list's current title and hides it while private.
    ActivityRecorder.invalidateFeeds(userId);
    return updated;
  }

  static async deleteList(
    listId: string,
    userId: string,
  ): Promise<void | ListServiceError> {
    const access = await ListAccessService.requireManager(listId, userId);
    if ("error" in access) return access;

    await ListsWriteService.remove(listId, { by: "author", userId });
  }

  static async addItem(
    listId: string,
    userId: string,
    tmdbId: number,
    itemType: "movie" | "serial",
  ): Promise<
    | { entry: NonNullable<Awaited<ReturnType<typeof ListsWriteRepository.insertEntry>>>; derivedType: string | null }
    | ListServiceError
  > {
    const access = await ListAccessService.requireEntryEditor(listId, userId);
    if ("error" in access) return access;

    // Checked before caching the title, so a full list costs no TMDB call or cache row.
    if ((await ListsReadRepository.countEntries(listId)) >= MAX_LIST_ITEMS) {
      return {
        error: `Lists are limited to ${MAX_LIST_ITEMS} items`,
        status: 400,
      };
    }

    const media = itemType === "movie"
      ? await FilmsCacheService.findOrCreate(tmdbId)
      : await TvCacheService.findOrCreate(tmdbId);

    const entry = await ListsWriteRepository.insertEntry({
      listId,
      movieId: itemType === "movie" ? media.id : undefined,
      tvSeriesId: itemType === "serial" ? media.id : undefined,
      itemType,
      addedByUserId: userId,
    });

    if (!entry) {
      return { error: "Already in this list", status: 409 };
    }

    const derivedType = await ListsWriteRepository.refreshDerivedType(listId);
    return { entry, derivedType };
  }

  static async removeItem(
    listId: string,
    userId: string,
    entryId: string,
  ): Promise<{ success: true; derivedType: string | null } | ListServiceError> {
    const access = await ListAccessService.requireEntryEditor(listId, userId);
    if ("error" in access) return access;

    const deleted = isUuid(entryId) && (await ListsWriteRepository.deleteEntry(listId, entryId));
    if (!deleted) {
      return { error: "Entry not found", status: 404 };
    }

    const derivedType = await ListsWriteRepository.refreshDerivedType(listId);
    return { success: true, derivedType };
  }

  static async updateItemNote(
    listId: string,
    userId: string,
    entryId: string,
    note: string | null,
  ): Promise<{ id: string; note: string | null } | ListServiceError> {
    const access = await ListAccessService.requireEntryEditor(listId, userId);
    if ("error" in access) return access;

    const updated = isUuid(entryId) ? await ListsWriteRepository.updateEntryNote(listId, entryId, note) : null;
    return updated ?? { error: "Entry not found", status: 404 };
  }

  // Items carry the full new order; a payload built from a stale view is a 409, never a partial write.
  static async reorderItems(
    listId: string,
    userId: string,
    items: Array<{ id: string; position: number }>,
  ): Promise<{ success: true } | ListServiceError> {
    const access = await ListAccessService.requireEntryEditor(listId, userId);
    if ("error" in access) return access;

    const entries = await ListsWriteRepository.getEntriesByIds(items.map((i) => i.id));
    if (entries.some((e) => e.listId !== listId) || entries.length !== items.length) {
      return { error: "Some entries do not belong to this list", status: 403 };
    }

    const orderedIds = [...items].sort((a, b) => a.position - b.position).map((i) => i.id);
    const changed = await ListsWriteRepository.reorderEntries(listId, orderedIds);
    if (changed !== orderedIds.length) {
      return { error: "This list changed while you were editing it. Reload and try again.", status: 409 };
    }

    return { success: true };
  }

  static async likeList(
    listId: string,
    userId: string,
  ): Promise<ListServiceError | { success: true; likeCount: number }> {
    const access = await ListAccessService.resolve(listId, userId);
    if (!access) return { error: "List not found", status: 404 as const };
    if (!canViewList(access.list, access.role)) return { error: "Forbidden", status: 403 as const };
    await ListsWriteRepository.likeList(userId, listId);
    const likeCount = await ListsWriteRepository.getListLikeCount(listId);
    return { success: true, likeCount };
  }

  static async unlikeList(listId: string, userId: string) {
    await ListsWriteRepository.unlikeList(userId, listId);
    const likeCount = await ListsWriteRepository.getListLikeCount(listId);
    return { success: true, likeCount };
  }

  // The one way a list goes, whoever removes it.
  static async remove(listId: string, removal: ContentRemoval) {
    if (!isUuid(listId)) {
      return null;
    }

    const removed = await ListsWriteRepository.deleteById(listId, removalOwnerId(removal));
    if (removed) {
      await Promise.all([
        ActivityRecorder.retract({ userId: removed.userId, type: "created_list", entityId: listId }),
        NotificationsService.notifyOfRemoval(removal, { authorId: removed.userId, id: listId, targetType: "list" }),
      ]);
    }
    return removed;
  }
}
