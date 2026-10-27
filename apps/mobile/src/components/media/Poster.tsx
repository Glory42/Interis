import { memo } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { Image } from "expo-image";
import { Film } from "lucide-react-native";
import { getPosterUrl } from "@/lib/media";
import { useTheme } from "@/theme";

type PosterProps = {
  posterPath: string | null | undefined;
  width: number;
  accentColor?: string;
  size?: "w185" | "w342" | "w500";
  style?: StyleProp<ViewStyle>;
};

// 2:3 TMDB poster with the web's "No Art" fallback (accent edge + icon).
export const Poster = memo(function Poster({
  posterPath,
  width,
  accentColor,
  size = "w342",
  style,
}: PosterProps) {
  const { colors, radius } = useTheme();
  const height = Math.round(width * 1.5);
  const uri = getPosterUrl(posterPath, size);
  const borderRadius = Math.min(radius, width / 6);

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          overflow: "hidden",
          backgroundColor: colors.secondary,
          borderWidth: 1,
          borderColor: colors.surfaceBorder,
        },
        style,
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          transition={180}
          recyclingKey={uri}
        />
      ) : (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            borderLeftWidth: 2,
            borderLeftColor: accentColor ?? colors.neutral,
          }}
        >
          <Film size={Math.max(14, width * 0.22)} color={colors.faint} />
        </View>
      )}
    </View>
  );
});
