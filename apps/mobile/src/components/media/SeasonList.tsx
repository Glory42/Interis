import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Check, ChevronRight } from "lucide-react-native";
import { useTheme } from "@/theme";
import type { SerialDetailResponse } from "@/types/serials";
import { AppText, SectionHeader } from "@/components/ui";
import { Poster } from "./Poster";

type Season = SerialDetailResponse["series"]["seasons"][number];

export const SeasonList = ({ tmdbId, seasons }: { tmdbId: number; seasons: Season[] }) => {
  const router = useRouter();
  const { colors } = useTheme();

  if (seasons.length === 0) {
    return null;
  }

  return (
    <View>
      <SectionHeader label={`Seasons · ${seasons.length}`} color={colors.serial} />
      {seasons.map((season) => (
        <Pressable
          key={season.id}
          onPress={() =>
            router.push({
              pathname: "/serial/[tmdbId]/season/[seasonNumber]",
              params: { tmdbId: String(tmdbId), seasonNumber: String(season.seasonNumber) },
            })
          }
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: colors.rowBorder,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Poster posterPath={season.posterPath} width={40} size="w185" accentColor={colors.serial} />
          <View style={{ flex: 1 }}>
            <AppText weight="semibold">{season.name}</AppText>
            <AppText size={12} tone="muted">
              {[season.episodeCount ? `${season.episodeCount} episodes` : null, season.airDate?.slice(0, 4)]
                .filter(Boolean)
                .join(" · ")}
            </AppText>
          </View>
          {season.viewerInteraction?.watched ? <Check size={16} color={colors.serial} /> : null}
          <ChevronRight size={18} color={colors.faint} />
        </Pressable>
      ))}
    </View>
  );
};
