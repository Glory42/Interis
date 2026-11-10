import { ActivityIndicator, Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import type { ReactNode } from "react";
import { useTheme } from "@/theme";
import { AppText } from "./AppText";

type ButtonVariant = "primary" | "outline" | "ghost" | "danger" | "pill";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  active?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

const HEIGHTS: Record<ButtonSize, number> = { sm: 32, md: 42, lg: 50 };
const FONT_SIZES: Record<ButtonSize, number> = { sm: 12, md: 14, lg: 15 };

export const Button = ({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  disabled = false,
  active = false,
  fullWidth = false,
  style,
}: ButtonProps) => {
  const { colors, radius } = useTheme();
  const isDisabled = disabled || loading;

  const palette: Record<ButtonVariant, { bg: string; border: string; fg: string }> = {
    primary: { bg: colors.primary, border: colors.primary, fg: colors.primaryForeground },
    danger: { bg: colors.destructive, border: colors.destructive, fg: colors.primaryForeground },
    outline: { bg: "transparent", border: colors.border, fg: colors.foreground },
    ghost: { bg: "transparent", border: "transparent", fg: colors.mutedForeground },
    pill: active
      ? { bg: colors.pillBg, border: colors.pillBorder, fg: colors.primary }
      : { bg: "transparent", border: colors.surfaceBorder, fg: colors.mutedForeground },
  };
  const { bg, border, fg } = palette[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, selected: active }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        {
          height: HEIGHTS[size],
          paddingHorizontal: size === "sm" ? 12 : 18,
          borderRadius: variant === "pill" ? 999 : radius,
          backgroundColor: bg,
          borderColor: border,
          borderWidth: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          opacity: isDisabled ? 0.55 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          alignSelf: fullWidth ? "stretch" : "auto",
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : icon ? (
        <View>{icon}</View>
      ) : null}
      <AppText weight="semibold" size={FONT_SIZES[size]} color={fg}>
        {label}
      </AppText>
    </Pressable>
  );
};
