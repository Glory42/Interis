export const clampPositiveInt = (value: number): number => Math.max(1, Math.floor(value));

export const normalizeSearchQuery = (query: string): string => query.trim();

type ArchiveSearchParamsInput = {
  genre?: string;
  language?: string;
  sort?: string;
  period?: string;
  page?: number;
  limit?: number;
};

export const buildArchiveSearchParams = (input: ArchiveSearchParamsInput): URLSearchParams => {
  const searchParams = new URLSearchParams();

  if (input.genre && input.genre.trim().length > 0) {
    searchParams.set("genre", input.genre.trim());
  }

  if (input.language && input.language.trim().length > 0) {
    searchParams.set("language", input.language.trim());
  }

  if (input.sort) {
    searchParams.set("sort", input.sort);
  }

  if (input.period) {
    searchParams.set("period", input.period);
  }

  if (typeof input.page === "number" && Number.isFinite(input.page)) {
    searchParams.set("page", String(clampPositiveInt(input.page)));
  }

  if (typeof input.limit === "number" && Number.isFinite(input.limit)) {
    searchParams.set("limit", String(clampPositiveInt(input.limit)));
  }

  return searchParams;
};

type DetailSearchParamsInput = {
  reviewsSort?: string;
};

export const buildDetailSearchParams = (input: DetailSearchParamsInput): URLSearchParams => {
  const searchParams = new URLSearchParams();

  if (input.reviewsSort) {
    searchParams.set("reviewsSort", input.reviewsSort);
  }

  return searchParams;
};
