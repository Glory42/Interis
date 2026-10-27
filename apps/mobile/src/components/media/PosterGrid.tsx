import type { ReactElement } from "react";
import { FlatList, RefreshControl, View, useWindowDimensions } from "react-native";
import { useTheme } from "@/theme";
import type { MediaType } from "@/types/common";
import { EmptyView, ErrorView, LoadingView } from "@/components/ui";
import { PosterTile } from "./PosterTile";

export type PosterGridItem = {
  key: string;
  mediaType: MediaType;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  year?: number | null;
  subtitle?: string | null;
  watched?: boolean;
  watchlisted?: boolean;
};

type PosterGridProps = {
  items: PosterGridItem[];
  columns?: number;
  header?: ReactElement;
  isLoading: boolean;
  isError: boolean;
  isFetchingMore: boolean;
  isRefreshing?: boolean;
  emptyTitle: string;
  emptyMessage?: string;
  onEndReached?: () => void;
  onRefresh?: () => void;
  onRetry?: () => void;
};

const GAP = 12;
const SIDE_PADDING = 16;

export const PosterGrid = ({
  items,
  columns = 3,
  header,
  isLoading,
  isError,
  isFetchingMore,
  isRefreshing = false,
  emptyTitle,
  emptyMessage,
  onEndReached,
  onRefresh,
  onRetry,
}: PosterGridProps) => {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const tileWidth = Math.floor((width - SIDE_PADDING * 2 - GAP * (columns - 1)) / columns);

  return (
    <FlatList
      data={items}
      key={columns}
      numColumns={columns}
      keyExtractor={(item) => item.key}
      columnWrapperStyle={{ gap: GAP, paddingHorizontal: SIDE_PADDING }}
      contentContainerStyle={{ paddingBottom: 32, gap: 18 }}
      ListHeaderComponent={header}
      renderItem={({ item }) => (
        <PosterTile
          mediaType={item.mediaType}
          tmdbId={item.tmdbId}
          title={item.title}
          posterPath={item.posterPath}
          year={item.year}
          subtitle={item.subtitle}
          watched={item.watched}
          watchlisted={item.watchlisted}
          width={tileWidth}
        />
      )}
      onEndReachedThreshold={0.5}
      onEndReached={onEndReached}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        ) : undefined
      }
      ListEmptyComponent={
        isLoading ? (
          <LoadingView />
        ) : isError ? (
          <ErrorView onRetry={onRetry} />
        ) : (
          <EmptyView title={emptyTitle} message={emptyMessage} />
        )
      }
      ListFooterComponent={isFetchingMore ? <LoadingView style={{ paddingVertical: 16 }} /> : <View />}
    />
  );
};
