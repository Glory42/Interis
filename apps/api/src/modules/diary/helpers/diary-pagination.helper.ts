import { DiaryQuerySchema } from "../dto/diary.dto";

const DEFAULT_DIARY_LIMIT = 1000;

// Always returns a bounded limit/offset (even with no query params) so
// GET /api/diary never fetches a whole diary in one unbounded request.
export const parseDiaryPagination = (query: unknown): { limit: number; offset: number } => {
  const parsed = DiaryQuerySchema.safeParse(query);
  if (!parsed.success) {
    return { limit: DEFAULT_DIARY_LIMIT, offset: 0 };
  }

  return {
    limit: parsed.data.limit ?? DEFAULT_DIARY_LIMIT,
    offset: parsed.data.offset ?? 0,
  };
};
