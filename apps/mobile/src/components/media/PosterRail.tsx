import { FlatList, View } from "react-native";
import type { MediaType } from "@/types/common";
import { LoadingView, SectionHeader } from "@/components/ui";
import { PosterTile } from "./PosterTile";

export type PosterRailItem = {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  year?: number | null;
  mediaType: MediaType;
};

type PosterRailProps = {
  label: string;
  color?: string;
  items: PosterRailItem[];
  isLoading?: boolean;
  tileWidth?: number;
};

export const PosterRail = ({ label, color, items, isLoading = false, tileWidth = 104 }: PosterRailProps) => {
  if (!isLoading && items.length === 0) {
    return null;
  }

  return (
    <View>
      <View style={{ paddingHorizontal: 16 }}>
        <SectionHeader label={label} color={color} />
      </View>
      {isLoading ? (
        <LoadingView style={{ paddingVertical: 24 }} />
      ) : (
        <FlatList
          horizontal
          data={items}
          keyExtractor={(item) => `${item.mediaType}-${item.tmdbId}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          renderItem={({ item }) => (
            <PosterTile
              mediaType={item.mediaType}
              tmdbId={item.tmdbId}
              title={item.title}
              posterPath={item.posterPath}
              year={item.year}
              width={tileWidth}
            />
          )}
        />
      )}
    </View>
  );
};
