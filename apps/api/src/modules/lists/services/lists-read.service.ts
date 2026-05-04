import { MoviesCacheService } from "../../movies/services/movies-cache.service";
import { SerialsCacheService } from "../../serials/services/serials-cache.service";
import { ListsReadRepository } from "../repositories/lists-read.repository";
import { ListsWriteRepository } from "../repositories/lists-write.repository";

export class ListsReadService {
  static async getUserLists(
    userId: string,
    publicOnly: boolean,
    checkTmdbId?: number,
    checkItemType?: string,
  ) {
    const listRows = await ListsReadRepository.findByUserId(userId, publicOnly);

    if (listRows.length === 0) {
      return [];
    }

    const listIds = listRows.map((l) => l.id);
    const coverImageRows = await ListsReadRepository.getCoverImages(listIds);

    // Group cover images by listId and take first 4 per list
    const coversByListId = new Map<
      string,
      Array<{ position: number; itemType: string; posterPath: string | null }>
    >();
    for (const row of coverImageRows) {
      const existing = coversByListId.get(row.listId) ?? [];
      if (existing.length < 4) {
        existing.push({
          position: row.position,
          itemType: row.itemType,
          posterPath: row.posterPath,
        });
        coversByListId.set(row.listId, existing);
      }
    }

    // Build a map of listId → entryId if checking for a specific item
    let itemInListsMap = new Map<string, string>();
    if (checkTmdbId !== undefined && checkItemType !== undefined) {
      let movieId: number | null = null;
      let tvSeriesId: number | null = null;

      if (checkItemType === "cinema") {
        const movie = await MoviesCacheService.findOrCreate(checkTmdbId).catch(() => null);
        movieId = movie?.id ?? null;
      } else if (checkItemType === "serial") {
        const serial = await SerialsCacheService.findOrCreate(checkTmdbId).catch(() => null);
        tvSeriesId = serial?.id ?? null;
      }

      if (movieId !== null || tvSeriesId !== null) {
        const entries = await ListsReadRepository.checkItemInListsForUser(
          userId,
          movieId,
          tvSeriesId,
        );
        itemInListsMap = new Map(entries.map((e) => [e.listId, e.entryId]));
      }
    }

    return listRows.map((list) => ({
      id: list.id,
      userId: list.userId,
      title: list.title,
      description: list.description,
      isRanked: list.isRanked,
      isPublic: list.isPublic,
      derivedType: list.derivedType,
      itemCount: list.itemCount,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
      coverImages: coversByListId.get(list.id) ?? [],
      containsItem:
        checkTmdbId !== undefined && checkItemType !== undefined
          ? itemInListsMap.has(list.id)
          : undefined,
      entryId:
        checkTmdbId !== undefined && checkItemType !== undefined
          ? (itemInListsMap.get(list.id) ?? null)
          : undefined,
    }));
  }

  static async getListDetail(listId: string, viewerUserId: string | null) {
    const list = await ListsReadRepository.findById(listId);

    if (!list) {
      return null;
    }

    if (!list.isPublic && viewerUserId !== list.userId) {
      return null;
    }

    const [itemRows, likeCount, likedByViewer] = await Promise.all([
      ListsReadRepository.getListItems(listId),
      ListsWriteRepository.getListLikeCount(listId),
      viewerUserId ? ListsWriteRepository.hasUserLikedList(viewerUserId, listId) : Promise.resolve(false),
    ]);

    const items = itemRows.map((row) => {
      if (row.itemType === "cinema") {
        return {
          id: row.id,
          position: row.position,
          itemType: row.itemType,
          note: row.note,
          tmdbId: row.movieTmdbId,
          title: row.movieTitle,
          posterPath: row.moviePosterPath,
          releaseYear: row.movieReleaseYear,
        };
      }

      return {
        id: row.id,
        position: row.position,
        itemType: row.itemType,
        note: row.note,
        tmdbId: row.serialTmdbId,
        title: row.serialTitle,
        posterPath: row.serialPosterPath,
        releaseYear: row.serialFirstAirYear,
      };
    });

    return {
      id: list.id,
      userId: list.userId,
      title: list.title,
      description: list.description,
      isRanked: list.isRanked,
      isPublic: list.isPublic,
      derivedType: list.derivedType,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
      items,
      itemCount: items.length,
      likeCount,
      likedByViewer,
    };
  }
}
