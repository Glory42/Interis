import { FlatList, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/theme";
import type { CurrentlyWatching } from "@/types/profile";
import { AppText, SectionHeader } from "@/components/ui";
import { Poster } from "@/components/media/Poster";

export const CurrentlyWatchingRail = ({ items }: { items: CurrentlyWatching[] }) => {
  const router = useRouter();
  const { colors } = useTheme();

  if (items.length === 0) {
    return null;
  }

  return (
    <View>
      <View style={{ paddingHorizontal: 16 }}>
        <SectionHeader label="Currently watching" color={colors.serial} />
      </View>
      <FlatList
        horizontal
        data={items}
        keyExtractor={(item) => String(item.tmdbId)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        renderItem={({ item }) => (
          <Pressable
            style={{ width: 104 }}
            onPress={() =>
              router.push({ pathname: "/serial/[tmdbId]", params: { tmdbId: String(item.tmdbId) } })
            }
          >
            <Poster posterPath={item.posterPath} width={104} accentColor={colors.serial} />
            <View style={{ height: 3, borderRadius: 2, backgroundColor: colors.border, marginTop: 6 }}>
              <View
                style={{
                  width: `${Math.max(0, Math.min(100, item.progressPercent))}%`,
                  height: 3,
                  borderRadius: 2,
                  backgroundColor: colors.serial,
                }}
              />
            </View>
            <AppText size={12} weight="semibold" numberOfLines={1} style={{ marginTop: 6 }}>
              {item.title}
            </AppText>
            {item.currentEpisode ? (
              <AppText variant="mono" size={10} tone="muted">
                S{item.currentEpisode.seasonNumber}E{item.currentEpisode.episodeNumber}
              </AppText>
            ) : null}
          </Pressable>
        )}
      />
    </View>
  );
};
