import type { MovieArchivePeriod, MovieArchiveSort } from "@/features/movies/api";
import {
  ARCHIVE_PAGE_SIZE,
  languageOptions,
  periodOptions,
} from "@/features/media/constants";
import { MOVIE_MODULE_STYLES } from "@/features/media/styles";

export { ARCHIVE_PAGE_SIZE, languageOptions, periodOptions, MOVIE_MODULE_STYLES };

export const sortOptions = [
  { value: "trending", label: "Trending" },
  { value: "release_desc", label: "Newest release" },
  { value: "release_asc", label: "Oldest release" },
  { value: "logs_desc", label: "Most logged" },
  { value: "rating_user_desc", label: "Highest rated (Users)" },
  { value: "rating_tmdb_desc", label: "Highest rated (TMDB)" },
  { value: "title_asc", label: "Title A-Z" },
] as const satisfies ReadonlyArray<{
  value: MovieArchiveSort;
  label: string;
}>;

export type { MovieArchivePeriod };
