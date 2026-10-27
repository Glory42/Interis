import { memo } from "react";
import { Pressable, View } from "react-native";
import { Rocket } from "lucide-react-native";
import { useTheme } from "@/theme";

const MAX_RATING = 10;

type RocketProps = { fill: number; size: number; color: string; emptyColor: string };

// One rocket, partially filled left-to-right (the web's SpaceRocket).
const RocketIcon = ({ fill, size, color, emptyColor }: RocketProps) => (
  <View style={{ width: size, height: size }}>
    <Rocket size={size} color={emptyColor} strokeWidth={1.75} />
    {fill > 0 ? (
      <View style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: size * fill, overflow: "hidden" }}>
        <Rocket size={size} color={color} fill={color} strokeWidth={1.75} />
      </View>
    ) : null}
  </View>
);

type RocketRatingDisplayProps = {
  rating: number | null;
  size?: number;
  color?: string;
};

export const RocketRatingDisplay = memo(function RocketRatingDisplay({
  rating,
  size = 12,
  color,
}: RocketRatingDisplayProps) {
  const { colors } = useTheme();
  const value = rating ?? 0;

  return (
    <View style={{ flexDirection: "row", gap: 2 }} accessibilityLabel={`${rating ?? 0} out of 10`}>
      {Array.from({ length: MAX_RATING }, (_, index) => (
        <RocketIcon
          key={index}
          fill={Math.max(0, Math.min(1, value - index))}
          size={size}
          color={color ?? colors.primary}
          emptyColor={colors.border}
        />
      ))}
    </View>
  );
});

type RocketRatingInputProps = {
  value: number | null;
  onChange: (value: number | null) => void;
  size?: number;
  color?: string;
  disabled?: boolean;
};

// Each rocket has a left and right half so ratings land on 0.5 steps, like
// the web's interactive SpaceRating. Tapping the current value clears it.
export const RocketRatingInput = ({
  value,
  onChange,
  size = 26,
  color,
  disabled = false,
}: RocketRatingInputProps) => {
  const { colors } = useTheme();
  const current = value ?? 0;

  const select = (next: number) => onChange(next === value ? null : next);

  return (
    <View style={{ flexDirection: "row", gap: 3, opacity: disabled ? 0.5 : 1 }}>
      {Array.from({ length: MAX_RATING }, (_, index) => (
        <View key={index} style={{ width: size, height: size }}>
          <RocketIcon
            fill={Math.max(0, Math.min(1, current - index))}
            size={size}
            color={color ?? colors.primary}
            emptyColor={colors.border}
          />
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, flexDirection: "row" }}>
            <Pressable
              disabled={disabled}
              accessibilityLabel={`Rate ${index + 0.5}`}
              style={{ flex: 1 }}
              onPress={() => select(index + 0.5)}
            />
            <Pressable
              disabled={disabled}
              accessibilityLabel={`Rate ${index + 1}`}
              style={{ flex: 1 }}
              onPress={() => select(index + 1)}
            />
          </View>
        </View>
      ))}
    </View>
  );
};
