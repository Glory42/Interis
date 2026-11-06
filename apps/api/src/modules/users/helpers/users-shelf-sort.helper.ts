import type { ProfileShelfSort } from "../dto/users.dto";

type ShelfSortableRow = { releaseYear: number | null; lastInteractionAt: Date };

export const compareShelfRows =
  (sort: ProfileShelfSort) =>
  (left: ShelfSortableRow, right: ShelfSortableRow): number => {
    const byInteraction = right.lastInteractionAt.getTime() - left.lastInteractionAt.getTime();
    if (sort === "oldest") return -byInteraction;
    if (sort === "release") {
      const leftYear = left.releaseYear ?? Number.NEGATIVE_INFINITY;
      const rightYear = right.releaseYear ?? Number.NEGATIVE_INFINITY;
      if (leftYear !== rightYear) return rightYear > leftYear ? 1 : -1;
    }
    return byInteraction;
  };
