import {
  useDeferredValue,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useBookSearch } from "@/features/books/hooks/useBooks";
import { useMovieSearch } from "@/features/films/hooks/useMovies";
import { useMusicSearch } from "@/features/music/hooks/useMusic";
import { useUserSearch } from "@/features/profile/hooks/useProfile";
import { useSerialSearch } from "@/features/serials/hooks/useSerials";
import {
  MAX_RESULTS_PER_SECTION,
  MIN_QUERY_LENGTH,
} from "./constants";
import { toBookEntry, toCinemaEntry, toMusicEntry, toSerialEntry, toUserEntry } from "./mappers";
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
  enterScopedMode: (target: ScopedTarget) => void;
  returnToHomeMode: () => void;
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
  const cinemaQueryValue =
    shouldRunSearch && (!isScopedMode || scopedTarget === "cinema")
      ? deferredQuery
      : "";
  const serialsQueryValue =
    shouldRunSearch && (!isScopedMode || scopedTarget === "serials")
      ? deferredQuery
      : "";
  const musicQueryValue =
    shouldRunSearch && (!isScopedMode || scopedTarget === "music")
      ? deferredQuery
      : "";
  const booksQueryValue =
    shouldRunSearch && (!isScopedMode || scopedTarget === "books")
      ? deferredQuery
      : "";

  const usersQuery = useUserSearch(usersQueryValue, MAX_RESULTS_PER_SECTION);
  const cinemaQuery = useMovieSearch(cinemaQueryValue);
  const serialsQuery = useSerialSearch(serialsQueryValue);
  const musicQuery = useMusicSearch(musicQueryValue);
  const booksQuery = useBookSearch(booksQueryValue);

  const userEntries = useMemo(() => {
    return (usersQuery.data ?? []).slice(0, MAX_RESULTS_PER_SECTION).map(toUserEntry);
  }, [usersQuery.data]);

  const cinemaEntries = useMemo(() => {
    return (cinemaQuery.data ?? []).slice(0, MAX_RESULTS_PER_SECTION).map(toCinemaEntry);
  }, [cinemaQuery.data]);

  const serialEntries = useMemo(() => {
    return (serialsQuery.data ?? []).slice(0, MAX_RESULTS_PER_SECTION).map(toSerialEntry);
  }, [serialsQuery.data]);

  const musicEntries = useMemo(() => {
    return (musicQuery.data ?? []).slice(0, MAX_RESULTS_PER_SECTION).map(toMusicEntry);
  }, [musicQuery.data]);

  const bookEntries = useMemo(() => {
    return (booksQuery.data ?? []).slice(0, MAX_RESULTS_PER_SECTION).map(toBookEntry);
  }, [booksQuery.data]);

  const sections = useMemo<SearchSection[]>(() => {
    if (!shouldRunSearch) {
      return [];
    }

    if (isScopedMode && scopedTarget === "users") {
      return [
        {
          target: "users",
          label: "Users",
          items: userEntries,
          isLoading: usersQuery.isFetching,
          isError: usersQuery.isError,
        },
      ];
    }

    if (isScopedMode && scopedTarget === "cinema") {
      return [
        {
          target: "cinema",
          label: "Cinema",
          items: cinemaEntries,
          isLoading: cinemaQuery.isFetching,
          isError: cinemaQuery.isError,
        },
      ];
    }

    if (isScopedMode && scopedTarget === "serials") {
      return [
        {
          target: "serials",
          label: "Serials",
          items: serialEntries,
          isLoading: serialsQuery.isFetching,
          isError: serialsQuery.isError,
        },
      ];
    }

    if (isScopedMode && scopedTarget === "music") {
      return [
        {
          target: "music",
          label: "Music",
          items: musicEntries,
          isLoading: musicQuery.isFetching,
          isError: musicQuery.isError,
        },
      ];
    }

    if (isScopedMode && scopedTarget === "books") {
      return [
        {
          target: "books",
          label: "Books",
          items: bookEntries,
          isLoading: booksQuery.isFetching,
          isError: booksQuery.isError,
        },
      ];
    }

    return [
      {
        target: "users",
        label: "Users",
        items: userEntries,
        isLoading: usersQuery.isFetching,
        isError: usersQuery.isError,
      },
      {
        target: "cinema",
        label: "Cinema",
        items: cinemaEntries,
        isLoading: cinemaQuery.isFetching,
        isError: cinemaQuery.isError,
      },
      {
        target: "serials",
        label: "Serials",
        items: serialEntries,
        isLoading: serialsQuery.isFetching,
        isError: serialsQuery.isError,
      },
      {
        target: "music",
        label: "Music",
        items: musicEntries,
        isLoading: musicQuery.isFetching,
        isError: musicQuery.isError,
      },
      {
        target: "books",
        label: "Books",
        items: bookEntries,
        isLoading: booksQuery.isFetching,
        isError: booksQuery.isError,
      },
    ];
  }, [
    shouldRunSearch,
    isScopedMode,
    scopedTarget,
    userEntries,
    cinemaEntries,
    serialEntries,
    musicEntries,
    bookEntries,
    usersQuery.isFetching,
    usersQuery.isError,
    cinemaQuery.isFetching,
    cinemaQuery.isError,
    serialsQuery.isFetching,
    serialsQuery.isError,
    musicQuery.isFetching,
    musicQuery.isError,
    booksQuery.isFetching,
    booksQuery.isError,
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

  const enterScopedMode = (target: ScopedTarget) => {
    setMode("scoped");
    setScopedTarget(target);
    setQueryInput("");
    setHighlightedIndex(0);
  };

  const returnToHomeMode = () => {
    setMode("home");
    setScopedTarget(null);
    setQueryInput("");
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
    enterScopedMode,
    returnToHomeMode,
    reset,
  };
};
