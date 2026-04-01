import { Link } from "@tanstack/react-router";
import {
  Award,
  BookText,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Film,
  Funnel,
  Globe2,
  Grid3X3,
  List,
  Plus,
  Star,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  type ArchiveMovie,
  type MovieArchivePeriod,
  type MovieArchiveSort,
} from "@/features/films/api";
import { getBackdropUrl, getPosterUrl } from "@/features/films/components/utils";
import { useMovieArchive } from "@/features/films/hooks/useMovies";
import { cn } from "@/lib/utils";

type ArchiveViewMode = "grid" | "list";
type OpenMenu = "genre" | "sort" | "language" | "period" | null;
type ArchiveRatingSource = "user" | "tmdb";

const ARCHIVE_PAGE_SIZE = 20;

const sortOptions: Array<{ value: MovieArchiveSort; label: string }> = [
  { value: "trending", label: "Trending" },
  { value: "release_desc", label: "Newest release" },
  { value: "release_asc", label: "Oldest release" },
  { value: "logs_desc", label: "Most logged" },
  { value: "rating_user_desc", label: "Highest rated (Users)" },
  { value: "rating_tmdb_desc", label: "Highest rated (TMDB)" },
  { value: "title_asc", label: "Title A-Z" },
];

const periodOptions: Array<{ value: MovieArchivePeriod; label: string }> = [
  { value: "all_time", label: "All time" },
  { value: "this_year", label: "This year" },
  { value: "last_10_years", label: "Last 10 years" },
  { value: "this_week", label: "This week" },
  { value: "today", label: "Today" },
];

const languageOptions = [
  { value: "all", label: "All languages" },
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "zh", label: "Chinese" },
  { value: "hi", label: "Hindi" },
  { value: "tr", label: "Turkish" },
  { value: "ru", label: "Russian" },
  { value: "ar", label: "Arabic" },
  { value: "sv", label: "Swedish" },
  { value: "da", label: "Danish" },
  { value: "no", label: "Norwegian" },
  { value: "fi", label: "Finnish" },
  { value: "nl", label: "Dutch" },
] as const;

const formatArchiveCount = (count: number): string => {
  if (count === 1) {
    return "1 title in the archive";
  }

  return `${count.toLocaleString()} titles in the archive`;
};

const getReleaseSortScore = (movie: ArchiveMovie): number => {
  if (movie.releaseDate) {
    const parsed = Date.parse(movie.releaseDate);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  if (movie.releaseYear !== null) {
    return Date.UTC(movie.releaseYear, 0, 1);
  }

  return Number.NEGATIVE_INFINITY;
};

const getReleaseYearLabel = (movie: ArchiveMovie): string => {
  if (movie.releaseYear !== null) {
    return String(movie.releaseYear);
  }

  if (movie.releaseDate && movie.releaseDate.length >= 4) {
    return movie.releaseDate.slice(0, 4);
  }

  return "Year unknown";
};

const getDirectorYearLine = (movie: ArchiveMovie): string => {
  const director = movie.director ?? "Unknown director";
  return `${director} · ${getReleaseYearLabel(movie)}`;
};

const getRatingOutOfFive = (
  movie: ArchiveMovie,
  ratingSource: ArchiveRatingSource,
): number | null => {
  const ratingOutOfTen =
    ratingSource === "tmdb" ? movie.tmdbRatingOutOfTen : movie.avgRatingOutOfTen;

  if (ratingOutOfTen === null) {
    return null;
  }

  return ratingOutOfTen / 2;
};

const getRoundedStars = (ratingOutOfFive: number | null): number => {
  if (ratingOutOfFive === null) {
    return 0;
  }

  return Math.max(0, Math.min(5, Math.round(ratingOutOfFive)));
};

const GridMovieCard = ({
  movie,
  ratingSource,
}: {
  movie: ArchiveMovie;
  ratingSource: ArchiveRatingSource;
}) => {
  const ratingOutOfFive = getRatingOutOfFive(movie, ratingSource);
  const roundedStars = getRoundedStars(ratingOutOfFive);

  return (
    <article className="group cursor-pointer">
      <div className="relative mb-2 aspect-[2/3] overflow-hidden rounded-xl border border-border/70 bg-card/60">
        <Link
          to="/cinema/$tmdbId"
          params={{ tmdbId: String(movie.tmdbId) }}
          className="block h-full w-full"
          viewTransition
        >
          <img
            src={getPosterUrl(movie.posterPath)}
            alt={`${movie.title} poster`}
            className="h-full w-full object-cover opacity-85 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
            loading="lazy"
          />
        </Link>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/95 via-transparent to-transparent opacity-0 transition-all duration-300 group-hover:opacity-100" />

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 translate-y-2 p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          {ratingOutOfFive !== null ? (
            <div className="mb-1 space-y-1">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={`archive-card-star-${movie.tmdbId}-${index}`}
                    className={cn(
                      "h-2.5 w-2.5",
                      index < roundedStars
                        ? "fill-primary text-primary"
                        : "text-muted-foreground/70",
                    )}
                  />
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground/95">
                {ratingSource === "tmdb" ? "TMDB" : "Users"} {ratingOutOfFive.toFixed(1)}
              </p>
            </div>
          ) : (
            <p className="mb-1 text-[10px] text-muted-foreground">
              {ratingSource === "tmdb" ? "No TMDB rating" : "No ratings yet"}
            </p>
          )}

          <p className="text-[10px] text-muted-foreground/95">
            {movie.logCount.toLocaleString()} logs
          </p>
        </div>

        <Link
          to="/cinema/$tmdbId"
          params={{ tmdbId: String(movie.tmdbId) }}
          className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/65 bg-background/65 text-foreground/90 opacity-0 transition-all duration-200 group-hover:opacity-100"
          aria-label={`Open ${movie.title}`}
          viewTransition
        >
          <Plus className="h-3.5 w-3.5" />
        </Link>
      </div>

      <Link
        to="/cinema/$tmdbId"
        params={{ tmdbId: String(movie.tmdbId) }}
        className="line-clamp-1 text-xs font-semibold leading-snug text-foreground transition-colors group-hover:text-primary"
        viewTransition
      >
        {movie.title}
      </Link>
      <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground/90">
        {getDirectorYearLine(movie)}
      </p>
    </article>
  );
};

const ListMovieRow = ({
  movie,
  rank,
  ratingSource,
}: {
  movie: ArchiveMovie;
  rank: number;
  ratingSource: ArchiveRatingSource;
}) => {
  const ratingOutOfFive = getRatingOutOfFive(movie, ratingSource);
  const roundedStars = getRoundedStars(ratingOutOfFive);

  return (
    <Link
      to="/cinema/$tmdbId"
      params={{ tmdbId: String(movie.tmdbId) }}
      className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-card/35 p-3 transition-all hover:border-border hover:bg-card/55"
      viewTransition
    >
      <span className="w-6 shrink-0 text-right font-mono text-xs text-muted-foreground/70">
        {rank}
      </span>

      <img
        src={getPosterUrl(movie.posterPath)}
        alt={`${movie.title} poster`}
        className="h-14 w-10 shrink-0 rounded-lg object-cover opacity-80 transition-opacity group-hover:opacity-100"
        loading="lazy"
      />

      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-1 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
          {movie.title}
        </h3>
        <p className="line-clamp-1 text-xs text-muted-foreground/85">
          {getDirectorYearLine(movie)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="hidden min-w-[84px] items-center justify-end gap-1.5 sm:inline-flex">
          {ratingOutOfFive !== null ? (
            <>
              <span className="inline-flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={`archive-row-star-${movie.tmdbId}-${index}`}
                    className={cn(
                      "h-2.75 w-2.75",
                      index < roundedStars
                        ? "fill-primary text-primary"
                        : "text-muted-foreground/65",
                    )}
                  />
                ))}
              </span>
              <span className="w-16 text-right font-mono text-[10px] text-muted-foreground">
                {ratingSource === "tmdb"
                  ? `TMDB ${ratingOutOfFive.toFixed(1)}`
                  : ratingOutOfFive.toFixed(1)}
              </span>
            </>
          ) : (
            <span className="text-[10px] text-muted-foreground">
              {ratingSource === "tmdb" ? "No TMDB" : "No rating"}
            </span>
          )}
        </div>

        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <BookText className="h-3 w-3" />
          <span>{movie.logCount.toLocaleString()}</span>
        </span>

        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/70 transition-colors group-hover:text-primary" />
      </div>
    </Link>
  );
};

const ArchiveSkeletonGrid = () => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
    {Array.from({ length: 12 }).map((_, index) => (
      <div key={`archive-skeleton-${index}`} className="animate-pulse">
        <div className="aspect-[2/3] rounded-xl border border-border/60 bg-card/40" />
        <div className="mt-2 h-3 rounded bg-card/55" />
        <div className="mt-1 h-2.5 w-3/4 rounded bg-card/40" />
      </div>
    ))}
  </div>
);

const ArchiveLoadingMoreRow = ({ viewMode }: { viewMode: ArchiveViewMode }) => {
  if (viewMode === "list") {
    return (
      <div className="mt-3 space-y-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={`archive-loading-list-${index}`}
            className="h-20 animate-pulse rounded-2xl border border-border/60 bg-card/35"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={`archive-loading-grid-${index}`}
          className="aspect-[2/3] animate-pulse rounded-xl border border-border/60 bg-card/35"
        />
      ))}
    </div>
  );
};

export const CinemaArchivePage = () => {
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedSort, setSelectedSort] = useState<MovieArchiveSort>("trending");
  const [selectedPeriod, setSelectedPeriod] = useState<MovieArchivePeriod>("this_year");
  const [viewMode, setViewMode] = useState<ArchiveViewMode>("grid");
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef<HTMLDivElement | null>(null);

  const archiveQuery = useMovieArchive(
    selectedGenre === "all" ? "" : selectedGenre,
    selectedLanguage === "all" ? "" : selectedLanguage,
    selectedSort,
    selectedPeriod,
    ARCHIVE_PAGE_SIZE,
  );

  const archivePages = archiveQuery.data?.pages;
  const firstPage = archivePages?.[0] ?? null;

  const { fetchNextPage, hasNextPage, isFetchingNextPage } = archiveQuery;

  const archiveItems = useMemo(
    () => (archivePages ? archivePages.flatMap((page) => page.items) : []),
    [archivePages],
  );

  const heroMovie = useMemo(() => {
    if (archiveItems.length === 0) {
      return null;
    }

    return [...archiveItems].sort(
      (left, right) => getReleaseSortScore(right) - getReleaseSortScore(left),
    )[0];
  }, [archiveItems]);

  const selectedSortLabel = useMemo(() => {
    return sortOptions.find((option) => option.value === selectedSort)?.label ?? "Trending";
  }, [selectedSort]);

  const selectedLanguageLabel = useMemo(() => {
    return (
      languageOptions.find((option) => option.value === selectedLanguage)?.label ??
      "All languages"
    );
  }, [selectedLanguage]);

  const selectedPeriodLabel = useMemo(() => {
    return periodOptions.find((option) => option.value === selectedPeriod)?.label ?? "This year";
  }, [selectedPeriod]);

  const archiveRatingSource: ArchiveRatingSource =
    selectedSort === "rating_tmdb_desc" ? "tmdb" : "user";

  const heroImageUrl = heroMovie?.backdropPath
    ? getBackdropUrl(heroMovie.backdropPath)
    : heroMovie?.posterPath
      ? getPosterUrl(heroMovie.posterPath)
      : null;

  const archiveCountLabel = useMemo(() => {
    if (!firstPage) {
      return "Loading archive...";
    }

    return formatArchiveCount(firstPage.filteredCount);
  }, [firstPage]);

  useEffect(() => {
    if (!openMenu) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (!controlsRef.current?.contains(target)) {
        setOpenMenu(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenu]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !hasNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting || !hasNextPage || isFetchingNextPage) {
          return;
        }

        void fetchNextPage();
      },
      {
        rootMargin: "300px 0px 300px 0px",
        threshold: 0.01,
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [archiveItems.length, fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className="min-h-screen">
      <section className="theme-hero-shell relative h-72 overflow-hidden">
        {heroImageUrl ? (
          <img
            src={heroImageUrl}
            alt={heroMovie ? heroMovie.title : "Cinema backdrop"}
            className="theme-hero-media h-full w-full object-cover opacity-30"
          />
        ) : (
          <div className="theme-hero-media h-full w-full bg-card" />
        )}

        <div className="theme-hero-gradient-layer absolute inset-0" />
        <div className="theme-hero-pattern-layer absolute inset-0" />

        <div className="theme-hero-readable-overlay absolute inset-y-0 left-0 w-[72%] bg-gradient-to-r from-background/76 via-background/34 to-transparent" />
        <div className="theme-hero-readable-overlay absolute inset-x-0 bottom-0 h-[52%] bg-gradient-to-t from-background/72 via-background/24 to-transparent" />

        <div className="theme-hero-safe-area mx-auto w-full max-w-7xl px-4">
          <div className="theme-hero-safe-content max-w-2xl">
            <div className="mb-2 flex items-center gap-2">
              <Film className="h-3.5 w-3.5 text-primary" />
              <span className="theme-kicker text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                Cinema
              </span>
            </div>

            <h1 className="theme-display-title text-4xl font-black tracking-tight text-foreground">
              Cinema
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{archiveCountLabel}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-8">
        <div
          ref={controlsRef}
          onBlurCapture={(event) => {
            if (!openMenu) {
              return;
            }

            const nextTarget = event.relatedTarget;
            if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
              setOpenMenu(null);
            }
          }}
          className="mb-8 flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card/55 px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                aria-haspopup="menu"
                aria-expanded={openMenu === "genre"}
                onClick={() => {
                  setOpenMenu((current) => (current === "genre" ? null : "genre"));
                }}
              >
                <Funnel className="h-3 w-3" />
                <span>
                  {selectedGenre === "all" ? "All Genres" : selectedGenre}
                </span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {openMenu === "genre" ? (
                <div className="absolute left-0 top-full z-40 mt-1 min-w-[170px] overflow-hidden rounded-xl border border-border/70 bg-card/95 shadow-2xl shadow-background/40 backdrop-blur-sm">
                  <div className="max-h-36 overflow-y-auto sm:max-h-48">
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={selectedGenre === "all"}
                      className={cn(
                        "w-full px-4 py-2 text-left text-xs transition-colors",
                        selectedGenre === "all"
                          ? "theme-menu-item-active"
                          : "text-muted-foreground hover:bg-secondary/65 hover:text-foreground",
                      )}
                      onClick={() => {
                        setSelectedGenre("all");
                        setOpenMenu(null);
                      }}
                    >
                      All Genres
                    </button>
                    {firstPage?.availableGenres.map((genre) => (
                      <button
                        key={`genre-option-${genre.name}`}
                        type="button"
                        role="menuitemradio"
                        aria-checked={selectedGenre === genre.name}
                        className={cn(
                          "w-full px-4 py-2 text-left text-xs transition-colors",
                          selectedGenre === genre.name
                            ? "theme-menu-item-active"
                            : "text-muted-foreground hover:bg-secondary/65 hover:text-foreground",
                        )}
                        onClick={() => {
                          setSelectedGenre(genre.name);
                          setOpenMenu(null);
                        }}
                      >
                        {typeof genre.count === "number"
                          ? `${genre.name} (${genre.count})`
                          : genre.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="relative">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card/55 px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                aria-haspopup="menu"
                aria-expanded={openMenu === "sort"}
                onClick={() => {
                  setOpenMenu((current) => (current === "sort" ? null : "sort"));
                }}
              >
                <Award className="h-3 w-3" />
                <span>Sort: {selectedSortLabel}</span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {openMenu === "sort" ? (
                <div className="absolute left-0 top-full z-40 mt-1 min-w-[160px] overflow-hidden rounded-xl border border-border/70 bg-card/95 shadow-2xl shadow-background/40 backdrop-blur-sm">
                  {sortOptions.map((option) => (
                    <button
                      key={`sort-option-${option.value}`}
                      type="button"
                      role="menuitemradio"
                      aria-checked={selectedSort === option.value}
                      className={cn(
                        "w-full px-4 py-2 text-left text-xs transition-colors",
                        selectedSort === option.value
                          ? "theme-menu-item-active"
                          : "text-muted-foreground hover:bg-secondary/65 hover:text-foreground",
                      )}
                      onClick={() => {
                        setSelectedSort(option.value);
                        setOpenMenu(null);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="relative">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card/55 px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                aria-haspopup="menu"
                aria-expanded={openMenu === "language"}
                onClick={() => {
                  setOpenMenu((current) =>
                    current === "language" ? null : "language",
                  );
                }}
              >
                <Globe2 className="h-3 w-3" />
                <span>Language: {selectedLanguageLabel}</span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {openMenu === "language" ? (
                <div className="absolute left-0 top-full z-40 mt-1 min-w-[180px] overflow-hidden rounded-xl border border-border/70 bg-card/95 shadow-2xl shadow-background/40 backdrop-blur-sm">
                  <div className="max-h-36 overflow-y-auto sm:max-h-48">
                    {languageOptions.map((option) => (
                      <button
                        key={`language-option-${option.value}`}
                        type="button"
                        role="menuitemradio"
                        aria-checked={selectedLanguage === option.value}
                        className={cn(
                          "w-full px-4 py-2 text-left text-xs transition-colors",
                          selectedLanguage === option.value
                            ? "theme-menu-item-active"
                            : "text-muted-foreground hover:bg-secondary/65 hover:text-foreground",
                        )}
                        onClick={() => {
                          setSelectedLanguage(option.value);
                          setOpenMenu(null);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="relative">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card/55 px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                aria-haspopup="menu"
                aria-expanded={openMenu === "period"}
                onClick={() => {
                  setOpenMenu((current) => (current === "period" ? null : "period"));
                }}
              >
                <CalendarDays className="h-3 w-3" />
                <span>Time: {selectedPeriodLabel}</span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {openMenu === "period" ? (
                <div className="absolute left-0 top-full z-40 mt-1 min-w-[160px] overflow-hidden rounded-xl border border-border/70 bg-card/95 shadow-2xl shadow-background/40 backdrop-blur-sm">
                  {periodOptions.map((option) => (
                    <button
                      key={`period-option-${option.value}`}
                      type="button"
                      role="menuitemradio"
                      aria-checked={selectedPeriod === option.value}
                      className={cn(
                        "w-full px-4 py-2 text-left text-xs transition-colors",
                        selectedPeriod === option.value
                          ? "theme-menu-item-active"
                          : "text-muted-foreground hover:bg-secondary/65 hover:text-foreground",
                      )}
                      onClick={() => {
                        setSelectedPeriod(option.value);
                        setOpenMenu(null);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="theme-segment-shell inline-flex items-center rounded-xl border border-border/70 bg-card/55 p-1">
            <button
              type="button"
              className={cn(
                "rounded-lg p-1.5 text-muted-foreground transition-colors",
                viewMode === "grid" ? "theme-segment-active" : "hover:text-foreground",
              )}
              aria-label="Grid view"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className={cn(
                "rounded-lg p-1.5 text-muted-foreground transition-colors",
                viewMode === "list" ? "theme-segment-active" : "hover:text-foreground",
              )}
              aria-label="List view"
              onClick={() => setViewMode("list")}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {archiveQuery.isPending ? <ArchiveSkeletonGrid /> : null}

        {archiveQuery.isError ? (
          <div className="rounded-xl border border-destructive/45 bg-destructive/10 p-4 text-sm text-destructive">
            Could not load the cinema archive right now.
          </div>
        ) : null}

        {!archiveQuery.isPending && !archiveQuery.isError && archiveItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 bg-card/30 p-8 text-center text-sm text-muted-foreground">
            No titles match these filters.
          </div>
        ) : null}

        {!archiveQuery.isPending && !archiveQuery.isError && archiveItems.length > 0 ? (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {archiveItems.map((movie) => (
                  <GridMovieCard
                    key={`archive-grid-${movie.tmdbId}`}
                    movie={movie}
                    ratingSource={archiveRatingSource}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                {archiveItems.map((movie, index) => (
                  <ListMovieRow
                    key={`archive-list-${movie.tmdbId}`}
                    movie={movie}
                    rank={index + 1}
                    ratingSource={archiveRatingSource}
                  />
                ))}
              </div>
            )}

            <div ref={loadMoreRef} className="h-4 w-full" aria-hidden />

            {isFetchingNextPage ? (
              <ArchiveLoadingMoreRow viewMode={viewMode} />
            ) : null}

            {!hasNextPage ? (
              <p className="mt-4 text-center text-[11px] text-muted-foreground">
                End of archive.
              </p>
            ) : null}
          </>
        ) : null}
      </section>
    </div>
  );
};
