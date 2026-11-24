import { Pressable } from "react-native";
import { Heart, MessageCircle } from "lucide-react-native";
import { useTheme } from "@/theme";
import { AppText } from "@/components/ui";

type CountButtonProps = {
  count: number;
  onPress?: () => void;
  disabled?: boolean;
};

export const LikeButton = ({ count, isLiked, onPress, disabled }: CountButtonProps & { isLiked: boolean }) => {
  const { colors } = useTheme();
  const color = isLiked ? colors.destructive : colors.mutedForeground;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={isLiked ? "Unlike" : "Like"}
      style={{ flexDirection: "row", alignItems: "center", gap: 6, opacity: disabled ? 0.5 : 1 }}
    >
      <Heart size={16} color={color} fill={isLiked ? color : "transparent"} />
      <AppText size={13} color={color}>
        {count}
      </AppText>
    </Pressable>
  );
};

export const CommentButton = ({ count, onPress, disabled }: CountButtonProps) => {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Comments"
      style={{ flexDirection: "row", alignItems: "center", gap: 6, opacity: disabled ? 0.5 : 1 }}
    >
      <MessageCircle size={16} color={colors.mutedForeground} />
      <AppText size={13} tone="muted">
        {count}
      </AppText>
    </Pressable>
  );
};
