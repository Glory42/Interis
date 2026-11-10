import { memo } from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/theme";
import { AppText } from "./AppText";

type AvatarProps = {
  username: string;
  avatarUrl?: string | null;
  size?: number;
};

// Same treatment as the web's FeedActorAvatar: the uploaded image, or the
// user's initial on a primary→accent gradient.
export const Avatar = memo(function Avatar({ username, avatarUrl, size = 40 }: AvatarProps) {
  const { colors } = useTheme();
  const shape = { width: size, height: size, borderRadius: size / 2, overflow: "hidden" as const };

  if (avatarUrl) {
    return (
      <View style={[shape, { backgroundColor: colors.secondary }]}>
        <Image source={{ uri: avatarUrl }} style={{ width: size, height: size }} contentFit="cover" />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[colors.primary, colors.accent]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[shape, { alignItems: "center", justifyContent: "center" }]}
    >
      <AppText variant="display" size={size * 0.4} color={colors.primaryForeground}>
        {username.slice(0, 1).toUpperCase()}
      </AppText>
    </LinearGradient>
  );
});
