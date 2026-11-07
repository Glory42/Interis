import { type SeriesArchiveSort } from "@/features/tv/api";
import {
  ARCHIVE_PAGE_SIZE,
  languageOptions,
  periodOptions,
} from "@/features/media/constants";
import { SERIES_MODULE_STYLES } from "@/features/media/styles";

export { ARCHIVE_PAGE_SIZE, languageOptions, periodOptions, SERIES_MODULE_STYLES };

export const sortOptions: Array<{ value: SeriesArchiveSort; label: string }> = [
  { value: "trending", label: "Trending" },
  { value: "first_air_desc", label: "Newest first air" },
  { value: "first_air_asc", label: "Oldest first air" },
  { value: "logs_desc", label: "Most logged" },
  { value: "rating_user_desc", label: "Highest rated (Users)" },
  { value: "rating_tmdb_desc", label: "Highest rated (TMDB)" },
  { value: "title_asc", label: "Title A-Z" },
];
