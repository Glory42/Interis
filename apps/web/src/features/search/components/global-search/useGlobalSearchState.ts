import {
  useDeferredValue,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useMovieSearch } from "@/features/movies/hooks/useMovies";
import { useUserSearch } from "@/features/profile/hooks/useProfile";
import { useTitleSearch } from "@/features/search/hooks/useSearch";
import { useSerialSearch } from "@/features/serials/hooks/useSerials";
import {
  MAX_RESULTS_PER_SECTION,
  MIN_QUERY_LENGTH,
  SECTION_LABEL,
} from "./constants";
import { toMovieEntry, toSerialEntry, toTitleEntry, toUserEntry } from "./mappers";
import type {
  ScopedTarget,
  SearchMode,
  SearchSection,
  SearchSectionOffset,
  SearchResultEntry,
} from "./types";

export type GlobalSearchState = {
  mode: SearchMode;
  scopedTarget: ScopedTarget | null;
  queryInput: string;
  normalizedQuery: string;
  hasMinQueryLength: boolean;
  shouldRunSearch: boolean;
  isScopedMode: boolean;
  highlightedIndex: number;
  setHighlightedIndex: Dispatch<SetStateAction<number>>;
  setQueryInput: Dispatch<SetStateAction<string>>;
  sections: SearchSection[];
  sectionOffsets: SearchSectionOffset[];
  visibleEntries: SearchResultEntry[];
  suggestionsCount: number;
  isAnyLoading: boolean;
  effectiveHighlightedIndex: number;
  // null searches everything; keeps whatever has been typed.
  setScope: (target: ScopedTarget | null) => void;
  reset: () => void;
};

export const useGlobalSearchState = (): GlobalSearchState => {
  const [mode, setMode] = useState<SearchMode>("home");
  const [scopedTarget, setScopedTarget] = useState<ScopedTarget | null>(null);
  const [queryInput, setQueryInput] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const normalizedQuery = queryInput.trim();
  const deferredQuery = useDeferredValue(normalizedQuery);
  const hasMinQueryLength = normalizedQuery.length >= MIN_QUERY_LENGTH;
  const shouldRunSearch = deferredQuery.length >= MIN_QUERY_LENGTH;

  const isScopedMode = mode === "scoped" && scopedTarget !== null;

  const usersQueryValue =
    shouldRunSearch && (!isScopedMode || scopedTarget === "users")
      ? deferredQuery
      : "";
  // Movie/serials queries only run in scoped (single-type drill-down) mode —
  // the unscoped home view uses the merged titlesQuery below instead.
  const movieQueryValue =
    shouldRunSearch && isScopedMode && scopedTarget === "movie"
      ? deferredQuery
      : "";
  const serialsQueryValue =
    shouldRunSearch && isScopedMode && scopedTarget === "serials"
      ? deferredQuery
      : "";
  const titlesQueryValue =
    shouldRunSearch && !isScopedMode ? deferredQuery : "";

  const usersQuery = useUserSearch(usersQueryValue, MAX_RESULTS_PER_SECTION);
  const movieQuery = useMovieSearch(movieQueryValue);
  const serialsQuery = useSerialSearch(serialsQueryValue);
  const titlesQuery = useTitleSearch(titlesQueryValue);

  const userEntries = useMemo(() => {
    return (usersQuery.data ?? []).slice(0, MAX_RESULTS_PER_SECTION).map(toUserEntry);
  }, [usersQuery.data]);

  const movieEntries = useMemo(() => {
    return (movieQuery.data ?? []).slice(0, MAX_RESULTS_PER_SECTION).map(toMovieEntry);
  }, [movieQuery.data]);

  const serialEntries = useMemo(() => {
    return (serialsQuery.data ?? []).slice(0, MAX_RESULTS_PER_SECTION).map(toSerialEntry);
  }, [serialsQuery.data]);

  // Films and TV get their own sections, ordered by whichever TMDB ranked first.
  const titleSections = useMemo(() => {
    const results = titlesQuery.data ?? [];
    type TitleTarget = "movie" | "serials";
    const targetOf = (mediaType: string): TitleTarget => (mediaType === "tv" ? "serials" : "movie");
    const order: TitleTarget[] = [...new Set(results.map((result) => targetOf(result.mediaType)))];
    return (order.length > 0 ? order : (["movie", "serials"] as TitleTarget[])).map((target): SearchSection => ({
      target,
      label: SECTION_LABEL[target],
      items: results
        .filter((result) => targetOf(result.mediaType) === target)
        .slice(0, MAX_RESULTS_PER_SECTION)
        .map(toTitleEntry),
      isLoading: titlesQuery.isFetching,
      isError: titlesQuery.isError,
    }));
  }, [titlesQuery.data, titlesQuery.isFetching, titlesQuery.isError]);

  const sections = useMemo<SearchSection[]>(() => {
    if (!shouldRunSearch) {
      return [];
    }

    if (isScopedMode && scopedTarget === "users") {
      return [{ target: "users", label: SECTION_LABEL.users, items: userEntries, isLoading: usersQuery.isFetching, isError: usersQuery.isError }];
    }

    if (isScopedMode && scopedTarget === "movie") {
      return [{ target: "movie", label: SECTION_LABEL.movie, items: movieEntries, isLoading: movieQuery.isFetching, isError: movieQuery.isError }];
    }

    if (isScopedMode && scopedTarget === "serials") {
      return [{ target: "serials", label: SECTION_LABEL.serials, items: serialEntries, isLoading: serialsQuery.isFetching, isError: serialsQuery.isError }];
    }

    return [
      ...titleSections,
      { target: "users", label: SECTION_LABEL.users, items: userEntries, isLoading: usersQuery.isFetching, isError: usersQuery.isError },
    ];
  }, [
    shouldRunSearch,
    isScopedMode,
    scopedTarget,
    userEntries,
    movieEntries,
    serialEntries,
    titleSections,
    usersQuery.isFetching,
    usersQuery.isError,
    movieQuery.isFetching,
    movieQuery.isError,
    serialsQuery.isFetching,
    serialsQuery.isError,
  ]);

  const sectionOffsets = useMemo(() => {
    let offset = 0;

    return sections.map((section) => {
      const startIndex = offset;
      offset += section.items.length;

      return { section, startIndex };
    });
  }, [sections]);

  const visibleEntries = useMemo(() => {
    return sections.flatMap((section) => section.items);
  }, [sections]);

  const suggestionsCount = visibleEntries.length;
  const isAnyLoading = sections.some((section) => section.isLoading);
  const effectiveHighlightedIndex =
    highlightedIndex >= 0 && highlightedIndex < suggestionsCount
      ? highlightedIndex
      : suggestionsCount > 0
        ? 0
        : -1;

  const setScope = (target: ScopedTarget | null) => {
    setMode(target ? "scoped" : "home");
    setScopedTarget(target);
    setHighlightedIndex(0);
  };

  const reset = () => {
    setMode("home");
    setScopedTarget(null);
    setQueryInput("");
    setHighlightedIndex(0);
  };

  return {
    mode,
    scopedTarget,
    queryInput,
    normalizedQuery,
    hasMinQueryLength,
    shouldRunSearch,
    isScopedMode,
    highlightedIndex,
    setHighlightedIndex,
    setQueryInput,
    sections,
    sectionOffsets,
    visibleEntries,
    suggestionsCount,
    isAnyLoading,
    effectiveHighlightedIndex,
    setScope,
    reset,
  };
};
