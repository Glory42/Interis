import { View, useWindowDimensions } from "react-native";
import { useTheme } from "@/theme";
import type { TopPicks } from "@/types/profile";
import { SectionHeader } from "@/components/ui";
import { PosterTile } from "@/components/media/PosterTile";

// The profile's "Top 4" favorites, one row each for movies and series.
export const TopPicksSection = ({ topPicks }: { topPicks: TopPicks }) => {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const tileWidth = Math.floor((width - 32 - 3 * 10) / 4);

  const categories = topPicks.categories.filter((category) =>
    category.items.some((item) => item.tmdbId !== null),
  );

  if (categories.length === 0) {
    return null;
  }

  return (
    <View style={{ paddingHorizontal: 16, gap: 18 }}>
      {categories.map((category) => (
        <View key={category.id}>
          <SectionHeader
            label={category.key === "movie" ? "Favorite films" : "Favorite series"}
            color={category.key === "movie" ? colors.movie : colors.serial}
          />
          <View style={{ flexDirection: "row", gap: 10 }}>
            {category.items
              .filter((item) => item.tmdbId !== null)
              .map((item) => (
                <PosterTile
                  key={item.slot}
                  mediaType={item.mediaType}
                  tmdbId={item.tmdbId as number}
                  title={item.title ?? "Untitled"}
                  posterPath={item.posterPath}
                  year={item.releaseYear}
                  width={tileWidth}
                />
              ))}
          </View>
        </View>
      ))}
    </View>
  );
};
