import { memo, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { mediaHref } from "@/lib/media";
import { useTheme } from "@/theme";
import type { MediaType } from "@/types/common";
import { AppText } from "@/components/ui";
import { Poster } from "./Poster";

type MediaPreviewCardProps = {
  mediaType: MediaType;
  tmdbId: number;
  title: string;
  releaseYear: number | null;
  posterPath: string | null;
  rightSlot?: ReactNode;
};

// The web's FeedMoviePreviewCard: poster + title + year with a thin
// movie/serial accent edge, used wherever a feed row references a title.
export const MediaPreviewCard = memo(function MediaPreviewCard({
  mediaType,
  tmdbId,
  title,
  releaseYear,
  posterPath,
  rightSlot,
}: MediaPreviewCardProps) {
  const router = useRouter();
  const { colors, radius } = useTheme();
  const accent = mediaType === "tv" ? colors.serial : colors.movie;

  return (
    <Pressable
      onPress={() => router.push(mediaHref(mediaType, tmdbId))}
      style={({ pressed }) => ({
        marginTop: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        alignSelf: "flex-start",
        maxWidth: 300,
        paddingVertical: 8,
        paddingLeft: 10,
        paddingRight: 14,
        borderRadius: radius - 2,
        borderWidth: 1,
        borderColor: colors.surfaceBorder,
        borderLeftWidth: 3,
        borderLeftColor: accent,
        backgroundColor: pressed ? colors.pillBg : "transparent",
      })}
    >
      {posterPath ? <Poster posterPath={posterPath} width={36} size="w185" /> : null}
      <View style={{ flexShrink: 1 }}>
        <AppText size={14} weight="semibold" numberOfLines={1}>
          {title}
        </AppText>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 }}>
          {releaseYear ? (
            <AppText size={12} tone="muted">
              {releaseYear}
            </AppText>
          ) : null}
          {rightSlot}
        </View>
      </View>
    </Pressable>
  );
});
