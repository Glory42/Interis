import { MoviesCacheService } from "../../movies/services/movies-cache.service";
import { SerialsCacheService } from "../../serials/services/serials-cache.service";
import { SocialRepository } from "../../social/repositories/social.repository";
import { SocialFeedService } from "../../social/services/social-feed.service";
import { MAX_LIST_ITEMS } from "../constants/lists.constants";
import type { CreateListDto, UpdateListDto } from "../dto/lists.dto";
import { deriveListType } from "../helpers/derive-list-type.helper";
import { ListsReadRepository } from "../repositories/lists-read.repository";
import { ListsWriteRepository } from "../repositories/lists-write.repository";

type ServiceError = { error: string; status: 400 | 403 | 404 };

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

    await SocialRepository.insertActivity({
      userId,
      type: "created_list",
      entityId: list.id,
      metadata: JSON.stringify({ title: list.title }),
    });

    SocialFeedService.invalidateFollowingFeed(userId);

    return list;
  }

  static async updateList(
    listId: string,
    userId: string,
    data: UpdateListDto,
  ): Promise<NonNullable<Awaited<ReturnType<typeof ListsWriteRepository.update>>> | ServiceError> {
    const list = await ListsReadRepository.findById(listId);

    if (!list) {
      return { error: "List not found", status: 404 };
    }

    if (list.userId !== userId) {
      return { error: "Forbidden", status: 403 };
    }

    const updated = await ListsWriteRepository.update(listId, data);

    if (!updated) {
      return { error: "List not found", status: 404 };
    }

    return updated;
  }

  static async deleteList(
    listId: string,
    userId: string,
  ): Promise<void | ServiceError> {
    const list = await ListsReadRepository.findById(listId);

    if (!list) {
      return { error: "List not found", status: 404 };
    }

    if (list.userId !== userId) {
      return { error: "Forbidden", status: 403 };
    }

    await ListsWriteRepository.deleteById(listId);
  }

  static async addItem(
    listId: string,
    userId: string,
    tmdbId: number,
    itemType: "cinema" | "serial",
  ): Promise<
    | { entry: NonNullable<Awaited<ReturnType<typeof ListsWriteRepository.insertEntry>>>; derivedType: string | null }
    | ServiceError
  > {
    const list = await ListsReadRepository.findById(listId);

    if (!list) {
      return { error: "List not found", status: 404 };
    }

    if (list.userId !== userId) {
      return { error: "Forbidden", status: 403 };
    }

    const currentTypes = await ListsReadRepository.getCurrentItemTypes(listId);
    if (currentTypes.length >= MAX_LIST_ITEMS) {
      return {
        error: `Lists are limited to ${MAX_LIST_ITEMS} items`,
        status: 400,
      };
    }

    let movieId: number | undefined;
    let tvSeriesId: number | undefined;

    const [media, maxPosition] = await Promise.all([
      itemType === "cinema"
        ? MoviesCacheService.findOrCreate(tmdbId)
        : SerialsCacheService.findOrCreate(tmdbId),
      ListsReadRepository.getMaxPosition(listId),
    ]);

    if (itemType === "cinema") {
      movieId = media.id;
    } else {
      tvSeriesId = media.id;
    }

    const position = maxPosition + 1;

    const entry = await ListsWriteRepository.insertEntry({
      listId,
      movieId,
      tvSeriesId,
      itemType,
      position,
    });

    if (!entry) {
      throw new Error("Failed to insert list entry");
    }

    const newDerivedType = deriveListType([...currentTypes, itemType]);

    await ListsWriteRepository.update(listId, { derivedType: newDerivedType });

    return { entry, derivedType: newDerivedType };
  }

  static async removeItem(
    listId: string,
    userId: string,
    entryId: string,
  ): Promise<{ success: true; derivedType: string | null } | ServiceError> {
    const [entry, list] = await Promise.all([
      ListsReadRepository.findEntryById(entryId),
      ListsReadRepository.findById(listId),
    ]);

    if (!entry) {
      return { error: "Entry not found", status: 404 };
    }

    if (!list) {
      return { error: "List not found", status: 404 };
    }

    if (list.userId !== userId) {
      return { error: "Forbidden", status: 403 };
    }

    await ListsWriteRepository.deleteEntry(entryId);

    const remainingTypes = await ListsReadRepository.getCurrentItemTypes(listId);
    const newDerivedType = deriveListType(remainingTypes);

    await ListsWriteRepository.update(listId, { derivedType: newDerivedType });

    return { success: true, derivedType: newDerivedType };
  }

  static async reorderItems(
    listId: string,
    userId: string,
    items: Array<{ id: string; position: number }>,
  ): Promise<{ success: true } | ServiceError> {
    const list = await ListsReadRepository.findById(listId);

    if (!list) {
      return { error: "List not found", status: 404 };
    }

    if (list.userId !== userId) {
      return { error: "Forbidden", status: 403 };
    }

    const entryIds = items.map((i) => i.id);
    const entries = await ListsWriteRepository.getEntriesByIds(entryIds);

    const allBelongToList = entries.every((e) => e.listId === listId);
    if (!allBelongToList || entries.length !== items.length) {
      return { error: "Some entries do not belong to this list", status: 403 };
    }

    await ListsWriteRepository.bulkUpdatePositions(items);

    return { success: true };
  }

  static async likeList(
    listId: string,
    userId: string,
  ): Promise<ServiceError | { success: true; likeCount: number }> {
    const list = await ListsReadRepository.findById(listId);
    if (!list) return { error: "List not found", status: 404 as const };
    if (!list.isPublic && list.userId !== userId)
      return { error: "Forbidden", status: 403 as const };
    await ListsWriteRepository.likeList(userId, listId);
    const likeCount = await ListsWriteRepository.getListLikeCount(listId);
    return { success: true, likeCount };
  }

  static async unlikeList(listId: string, userId: string) {
    await ListsWriteRepository.unlikeList(userId, listId);
    const likeCount = await ListsWriteRepository.getListLikeCount(listId);
    return { success: true, likeCount };
  }

  // No ownership check — admin moderation only.
  static async deleteForAdmin(listId: string): Promise<{ deleted: boolean }> {
    const list = await ListsReadRepository.findById(listId);
    if (!list) {
      return { deleted: false };
    }

    await ListsWriteRepository.deleteById(listId);
    return { deleted: true };
  }
}
