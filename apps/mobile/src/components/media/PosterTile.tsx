import { memo } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Bookmark, Check } from "lucide-react-native";
import { mediaHref } from "@/lib/media";
import { useTheme } from "@/theme";
import type { MediaType } from "@/types/common";
import { AppText } from "@/components/ui";
import { Poster } from "./Poster";

type PosterTileProps = {
  mediaType: MediaType;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  year?: number | string | null;
  subtitle?: string | null;
  width: number;
  watched?: boolean;
  watchlisted?: boolean;
};

// Grid/rail item: poster + title + year. Memoized because archive and
// profile grids re-render on every filter/tab change (CLAUDE.md list rule).
export const PosterTile = memo(function PosterTile({
  mediaType,
  tmdbId,
  title,
  posterPath,
  year,
  subtitle,
  width,
  watched = false,
  watchlisted = false,
}: PosterTileProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const accent = mediaType === "tv" ? colors.serial : colors.movie;

  return (
    <Pressable
      onPress={() => router.push(mediaHref(mediaType, tmdbId))}
      style={({ pressed }) => ({ width, opacity: pressed ? 0.8 : 1 })}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View>
        <Poster posterPath={posterPath} width={width} accentColor={accent} />
        {watched || watchlisted ? (
          <View style={{ position: "absolute", top: 6, right: 6, flexDirection: "row", gap: 4 }}>
            {watched ? (
              <View style={{ backgroundColor: colors.overlay, borderRadius: 10, padding: 3 }}>
                <Check size={12} color={accent} />
              </View>
            ) : null}
            {watchlisted ? (
              <View style={{ backgroundColor: colors.overlay, borderRadius: 10, padding: 3 }}>
                <Bookmark size={12} color={colors.primary} />
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
      <AppText size={12} weight="semibold" numberOfLines={1} style={{ marginTop: 6 }}>
        {title}
      </AppText>
      {year || subtitle ? (
        <AppText size={11} tone="muted" numberOfLines={1}>
          {[year, subtitle].filter(Boolean).join(" · ")}
        </AppText>
      ) : null}
    </Pressable>
  );
});
