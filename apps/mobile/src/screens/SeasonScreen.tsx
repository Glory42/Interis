import { FlatList, Pressable, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { Check } from "lucide-react-native";
import { useTheme } from "@/theme";
import { useAuth } from "@/hooks/useAuth";
import { useSeasonDetail, useToggleEpisodeWatched, useToggleSeasonWatched } from "@/hooks/useSerials";
import { AppText, Button, ErrorView, LoadingView, Screen } from "@/components/ui";

const TMDB_STILL_BASE = "https://image.tmdb.org/t/p/w300";

export const SeasonScreen = () => {
  const { colors, radius } = useTheme();
  const params = useLocalSearchParams<{ tmdbId: string; seasonNumber: string }>();
  const tmdbId = Number(params.tmdbId);
  const seasonNumber = Number(params.seasonNumber);
  const { user } = useAuth();

  const seasonQuery = useSeasonDetail(tmdbId, seasonNumber);
  const toggleEpisode = useToggleEpisodeWatched(tmdbId, seasonNumber);
  const toggleSeason = useToggleSeasonWatched(tmdbId, seasonNumber);

  if (seasonQuery.isPending) {
    return (
      <Screen>
        <LoadingView />
      </Screen>
    );
  }

  if (seasonQuery.isError || !seasonQuery.data) {
    return (
      <Screen>
        <ErrorView onRetry={() => void seasonQuery.refetch()} />
      </Screen>
    );
  }

  const { season, episodes } = seasonQuery.data;
  const allWatched = episodes.length > 0 && episodes.every((episode) => episode.viewerInteraction?.watched);

  return (
    <Screen>
      <Stack.Screen options={{ title: season.name }} />
      <FlatList
        data={episodes}
        keyExtractor={(episode) => String(episode.id)}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 6 }}>
            {season.overview ? (
              <AppText size={14} tone="muted">
                {season.overview}
              </AppText>
            ) : null}
            {user ? (
              <Button
                label={allWatched ? "Season watched" : "Mark season watched"}
                variant={allWatched ? "pill" : "outline"}
                active={allWatched}
                size="sm"
                loading={toggleSeason.isPending}
                onPress={() => toggleSeason.mutate(!allWatched)}
                style={{ alignSelf: "flex-start" }}
              />
            ) : null}
          </View>
        }
        renderItem={({ item: episode }) => {
          const isWatched = episode.viewerInteraction?.watched ?? false;
          return (
            <View
              style={{
                flexDirection: "row",
                gap: 12,
                padding: 10,
                borderRadius: radius,
                borderWidth: 1,
                borderColor: isWatched ? colors.serial : colors.surfaceBorder,
                backgroundColor: colors.surfaceCard,
              }}
            >
              <View
                style={{
                  width: 112,
                  height: 63,
                  borderRadius: radius - 4,
                  overflow: "hidden",
                  backgroundColor: colors.secondary,
                }}
              >
                {episode.stillPath ? (
                  <Image
                    source={{ uri: `${TMDB_STILL_BASE}${episode.stillPath}` }}
                    style={{ flex: 1 }}
                    contentFit="cover"
                  />
                ) : null}
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="mono" size={10} color={colors.serial}>
                  E{episode.episodeNumber}
                  {episode.runtimeLabel ? ` · ${episode.runtimeLabel}` : ""}
                </AppText>
                <AppText weight="semibold" size={14} numberOfLines={2}>
                  {episode.name}
                </AppText>
                {episode.airDate ? (
                  <AppText size={11} tone="muted">
                    {episode.airDate}
                  </AppText>
                ) : null}
              </View>
              {user ? (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isWatched }}
                  accessibilityLabel={`Mark episode ${episode.episodeNumber} watched`}
                  hitSlop={10}
                  onPress={() => toggleEpisode.mutate({ episodeNumber: episode.episodeNumber, watched: !isWatched })}
                  style={{
                    alignSelf: "center",
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    borderWidth: 1,
                    borderColor: isWatched ? colors.serial : colors.border,
                    backgroundColor: isWatched ? colors.serial : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isWatched ? <Check size={16} color={colors.background} /> : null}
                </Pressable>
              ) : null}
            </View>
          );
        }}
      />
    </Screen>
  );
};
