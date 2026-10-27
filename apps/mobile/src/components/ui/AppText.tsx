import { Text, type TextProps, type TextStyle } from "react-native";
import { useTheme } from "@/theme";

type Variant = "body" | "display" | "kicker" | "caption" | "mono";
type Tone = "default" | "muted" | "faint" | "primary" | "accent" | "destructive" | "inverse";
type Weight = "regular" | "medium" | "semibold" | "bold";

export type AppTextProps = TextProps & {
  variant?: Variant;
  tone?: Tone;
  weight?: Weight;
  size?: number;
  color?: string;
  align?: TextStyle["textAlign"];
};

const DEFAULT_SIZES: Record<Variant, number> = {
  body: 15,
  display: 22,
  kicker: 10,
  caption: 12,
  mono: 11,
};

export const AppText = ({
  variant = "body",
  tone = "default",
  weight,
  size,
  color,
  align,
  style,
  ...rest
}: AppTextProps) => {
  const theme = useTheme();
  const { colors, fonts } = theme;

  const toneColor: Record<Tone, string> = {
    default: colors.foreground,
    muted: colors.mutedForeground,
    faint: colors.faint,
    primary: colors.primary,
    accent: colors.accent,
    destructive: colors.destructive,
    inverse: colors.primaryForeground,
  };

  const resolveFontFamily = (): string => {
    if (variant === "display") {
      return weight === "regular" || weight === "medium" ? fonts.display : fonts.displayBold;
    }
    if (variant === "kicker" || variant === "mono") {
      return weight === "regular" || weight === "medium" ? fonts.mono : fonts.monoBold;
    }
    switch (weight) {
      case "medium":
        return fonts.bodyMedium;
      case "semibold":
        return fonts.bodySemiBold;
      case "bold":
        return fonts.bodyBold;
      default:
        return fonts.body;
    }
  };

  const fontSize = size ?? DEFAULT_SIZES[variant];

  const variantStyle: TextStyle =
    variant === "kicker"
      ? { textTransform: "uppercase", letterSpacing: fontSize * 0.18 }
      : variant === "display"
        ? { letterSpacing: -fontSize * 0.02 }
        : {};

  return (
    <Text
      {...rest}
      style={[
        {
          color: color ?? toneColor[tone],
          fontFamily: resolveFontFamily(),
          fontSize,
          lineHeight: variant === "kicker" ? undefined : Math.round(fontSize * 1.4),
          textAlign: align,
        },
        variantStyle,
        style,
      ]}
    />
  );
};
