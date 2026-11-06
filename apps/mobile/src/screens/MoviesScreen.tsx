import { useMemo, useState } from "react";
import { View } from "react-native";
import { formatRatingLabel } from "@/lib/media";
import { useTheme } from "@/theme";
import type { ArchivePeriod } from "@/types/common";
import type { MovieArchiveSort } from "@/types/movies";
import { useMovieArchive } from "@/hooks/useMovies";
import { ChipRow, Screen, TabHeader, type ChipOption } from "@/components/ui";
import { PosterGrid, type PosterGridItem } from "@/components/media/PosterGrid";

const SORT_OPTIONS: ChipOption<MovieArchiveSort>[] = [
  { value: "trending", label: "Trending" },
  { value: "logs_desc", label: "Most logged" },
  { value: "rating_user_desc", label: "Top rated" },
  { value: "rating_tmdb_desc", label: "TMDB rating" },
  { value: "release_desc", label: "Newest" },
  { value: "release_asc", label: "Oldest" },
  { value: "title_asc", label: "A–Z" },
];

const PERIOD_OPTIONS: ChipOption<ArchivePeriod>[] = [
  { value: "all_time", label: "All time" },
  { value: "this_year", label: "This year" },
  { value: "last_10_years", label: "Last 10 years" },
  { value: "this_week", label: "This week" },
  { value: "today", label: "Today" },
];

const ALL_GENRES = "__all__";

export const MoviesScreen = () => {
  const { colors } = useTheme();
  const [sort, setSort] = useState<MovieArchiveSort>("trending");
  const [period, setPeriod] = useState<ArchivePeriod>("all_time");
  const [genre, setGenre] = useState<string>(ALL_GENRES);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const archiveQuery = useMovieArchive({
    sort,
    period,
    genre: genre === ALL_GENRES ? undefined : genre,
  });

  const firstPage = archiveQuery.data?.pages[0];
  const genreOptions = useMemo<ChipOption<string>[]>(
    () => [
      { value: ALL_GENRES, label: "All genres" },
      ...(firstPage?.availableGenres ?? []).map((entry) => ({ value: entry.name, label: entry.name })),
    ],
    [firstPage?.availableGenres],
  );

  const items = useMemo<PosterGridItem[]>(
    () =>
      (archiveQuery.data?.pages.flatMap((page) => page.items) ?? []).map((movie) => ({
        key: String(movie.tmdbId),
        mediaType: "movie",
        tmdbId: movie.tmdbId,
        title: movie.title,
        posterPath: movie.posterPath,
        year: movie.releaseYear,
        subtitle: formatRatingLabel(movie.avgRatingOutOfTen ?? movie.tmdbRatingOutOfTen, { withSuffix: false }),
        watched: movie.viewerHasLogged,
        watchlisted: movie.viewerWatchlisted,
      })),
    [archiveQuery.data],
  );

  return (
    <Screen withTopInset>
      <TabHeader
        kicker={firstPage ? `Archive · ${firstPage.filteredCount} titles` : "Archive"}
        title="Movies"
      />
      <PosterGrid
        items={items}
        header={
          <View style={{ gap: 10, paddingTop: 14, paddingBottom: 4 }}>
            <ChipRow options={SORT_OPTIONS} value={sort} onChange={setSort} accentColor={colors.movie} />
            <ChipRow options={PERIOD_OPTIONS} value={period} onChange={setPeriod} accentColor={colors.movie} />
            {genreOptions.length > 1 ? (
              <ChipRow options={genreOptions} value={genre} onChange={setGenre} accentColor={colors.movie} />
            ) : null}
          </View>
        }
        isLoading={archiveQuery.isPending}
        isError={archiveQuery.isError}
        isFetchingMore={archiveQuery.isFetchingNextPage}
        isRefreshing={isRefreshing}
        emptyTitle="No movies here yet"
        emptyMessage="Try another filter."
        onRetry={() => void archiveQuery.refetch()}
        onRefresh={async () => {
          setIsRefreshing(true);
          await archiveQuery.refetch().finally(() => setIsRefreshing(false));
        }}
        onEndReached={() => {
          if (archiveQuery.hasNextPage && !archiveQuery.isFetchingNextPage) {
            void archiveQuery.fetchNextPage();
          }
        }}
      />
    </Screen>
  );
};
