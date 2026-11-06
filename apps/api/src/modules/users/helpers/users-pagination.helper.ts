import {
  ProfileListQuerySchema,
  ProfileShelfQuerySchema,
  type ProfileShelfSort,
  type ProfileShelfType,
} from "../dto/users.dto";

const DEFAULT_PROFILE_LIST_LIMIT = 60;

// Always returns a bounded limit/offset (even with no query params) so
// profile list endpoints (likes, watchlist, reviews, liked-reviews,
// liked-lists) never fetch an entire unbounded collection in one request.
export const parseProfileListPagination = (
  query: unknown,
): { limit: number; offset: number } => {
  const parsed = ProfileListQuerySchema.safeParse(query);
  if (!parsed.success) {
    return { limit: DEFAULT_PROFILE_LIST_LIMIT, offset: 0 };
  }

  return {
    limit: parsed.data.limit ?? DEFAULT_PROFILE_LIST_LIMIT,
    offset: parsed.data.offset ?? 0,
  };
};

export const parseProfileShelfQuery = (
  query: unknown,
): { type: ProfileShelfType; sort: ProfileShelfSort; limit: number; offset: number } => {
  const { type, sort } = ProfileShelfQuerySchema.parse(query ?? {});
  return { type, sort, ...parseProfileListPagination(query) };
};
