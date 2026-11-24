import { memo } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Repeat } from "lucide-react-native";
import { mediaHref } from "@/lib/media";
import { parseDateOnly } from "@/lib/time";
import { useTheme } from "@/theme";
import type { DiaryItem } from "@/types/profile";
import { AppText } from "@/components/ui";
import { Poster } from "@/components/media/Poster";
import { RocketRatingDisplay } from "@/components/media/RocketRating";

// One diary line: big day number (like the web's diary table), poster,
// title, rating and rewatch marker.
export const DiaryRow = memo(function DiaryRow({ item }: { item: DiaryItem }) {
  const router = useRouter();
  const { colors } = useTheme();
  const date = parseDateOnly(item.watchedDate);
  const accent = item.mediaType === "tv" ? colors.serial : colors.movie;

  return (
    <Pressable
      onPress={() => router.push(mediaHref(item.mediaType, item.media.tmdbId))}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.rowBorder,
        backgroundColor: pressed ? colors.pillBg : "transparent",
      })}
    >
      <View style={{ width: 40, alignItems: "center" }}>
        <AppText variant="kicker" size={8} tone="muted">
          {date.toLocaleDateString("en", { month: "short" })}
        </AppText>
        <AppText variant="display" size={22}>
          {date.getDate()}
        </AppText>
      </View>
      <Poster posterPath={item.media.posterPath} width={40} size="w185" accentColor={accent} />
      <View style={{ flex: 1, gap: 4 }}>
        <AppText weight="semibold" size={14} numberOfLines={1}>
          {item.media.title}
          {item.media.releaseYear ? (
            <AppText size={12} tone="muted">{`  ${item.media.releaseYear}`}</AppText>
          ) : null}
        </AppText>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {item.rating !== null ? <RocketRatingDisplay rating={item.rating} size={10} color={accent} /> : null}
          {item.rewatch ? <Repeat size={12} color={colors.mutedForeground} /> : null}
          {item.review ? (
            <AppText variant="kicker" size={8} tone="faint">
              review
            </AppText>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});
