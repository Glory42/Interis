import { View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { getBackdropUrl } from "@/lib/media";
import { withAlpha } from "@/lib/color";
import { useTheme } from "@/theme";
import { AppText } from "@/components/ui";
import { Poster } from "./Poster";

type MediaHeroProps = {
  kicker: string;
  accentColor: string;
  title: string;
  backdropPath: string | null;
  posterPath: string | null;
  metaLine: string;
  tagline?: string | null;
};

// Mobile version of the web detail header: a backdrop fading into the page
// (MediaDetailBackdrop) with the poster overlapping it, then title + meta.
export const MediaHero = ({
  kicker,
  accentColor,
  title,
  backdropPath,
  posterPath,
  metaLine,
  tagline,
}: MediaHeroProps) => {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const backdropHeight = Math.round(width * 0.62);
  const backdropUri = getBackdropUrl(backdropPath);

  return (
    <View>
      <View style={{ height: backdropHeight, backgroundColor: colors.muted }}>
        {backdropUri ? (
          <Image source={{ uri: backdropUri }} style={{ flex: 1 }} contentFit="cover" transition={220} />
        ) : (
          <LinearGradient
            colors={[withAlpha(accentColor, 0.28), colors.background]}
            style={{ flex: 1 }}
          />
        )}
        <LinearGradient
          colors={[withAlpha(colors.background, 0.1), withAlpha(colors.background, 0.55), colors.background]}
          locations={[0, 0.6, 1]}
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
        />
      </View>

      <View style={{ flexDirection: "row", gap: 16, paddingHorizontal: 16, marginTop: -84 }}>
        <Poster posterPath={posterPath} width={116} size="w500" accentColor={accentColor} />
        <View style={{ flex: 1, justifyContent: "flex-end", paddingBottom: 4 }}>
          <AppText variant="kicker" size={9} color={accentColor}>
            {kicker}
          </AppText>
          <AppText variant="display" size={24} style={{ marginTop: 4 }} numberOfLines={3}>
            {title}
          </AppText>
          {metaLine ? (
            <AppText size={12} tone="muted" style={{ marginTop: 4 }}>
              {metaLine}
            </AppText>
          ) : null}
        </View>
      </View>

      {tagline ? (
        <AppText
          size={14}
          tone="muted"
          style={{ paddingHorizontal: 16, marginTop: 14, fontStyle: "italic" }}
        >
          “{tagline}”
        </AppText>
      ) : null}
    </View>
  );
};
