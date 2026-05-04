import type { CreateListDto, UpdateListDto } from "./dto/lists.dto";
import { ListsReadService } from "./services/lists-read.service";
import { ListsWriteService } from "./services/lists-write.service";

export class ListsService {
  static async getUserLists(
    userId: string,
    publicOnly: boolean,
    checkTmdbId?: number,
    checkItemType?: string,
  ) {
    return ListsReadService.getUserLists(userId, publicOnly, checkTmdbId, checkItemType);
  }

  static async getListDetail(listId: string, viewerUserId: string | null) {
    return ListsReadService.getListDetail(listId, viewerUserId);
  }

  static async createList(userId: string, data: CreateListDto) {
    return ListsWriteService.createList(userId, data);
  }

  static async updateList(listId: string, userId: string, data: UpdateListDto) {
    return ListsWriteService.updateList(listId, userId, data);
  }

  static async deleteList(listId: string, userId: string) {
    return ListsWriteService.deleteList(listId, userId);
  }

  static async addItem(
    listId: string,
    userId: string,
    tmdbId: number,
    itemType: "cinema" | "serial",
  ) {
    return ListsWriteService.addItem(listId, userId, tmdbId, itemType);
  }

  static async removeItem(listId: string, userId: string, entryId: string) {
    return ListsWriteService.removeItem(listId, userId, entryId);
  }

  static async reorderItems(
    listId: string,
    userId: string,
    items: Array<{ id: string; position: number }>,
  ) {
    return ListsWriteService.reorderItems(listId, userId, items);
  }

  static async likeList(listId: string, userId: string) {
    return ListsWriteService.likeList(listId, userId);
  }

  static async unlikeList(listId: string, userId: string) {
    return ListsWriteService.unlikeList(listId, userId);
  }
}
