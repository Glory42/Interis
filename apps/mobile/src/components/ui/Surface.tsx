import { Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import type { ReactNode } from "react";
import { useTheme } from "@/theme";

type SurfaceProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  onPress?: PressableProps["onPress"];
  accentColor?: string;
};

// React Native port of the web's `.surface-card`: a soft-bordered panel with
// no shadow, shared by feed, profile, archive and settings.
export const Surface = ({ children, style, padding = 16, onPress, accentColor }: SurfaceProps) => {
  const { colors, radius } = useTheme();

  const baseStyle: ViewStyle = {
    backgroundColor: colors.surfaceCard,
    borderColor: colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: radius,
    padding,
    ...(accentColor ? { borderLeftColor: accentColor, borderLeftWidth: 3 } : null),
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          baseStyle,
          pressed && { borderColor: colors.surfaceBorderStrong, opacity: 0.92 },
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[baseStyle, style]}>{children}</View>;
};
