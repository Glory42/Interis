import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import type { ReactNode } from "react";
import { useTheme } from "@/theme";
import { AppText } from "./AppText";

type IconButtonProps = {
  icon: ReactNode;
  onPress?: () => void;
  accessibilityLabel: string;
  badge?: number;
  style?: StyleProp<ViewStyle>;
  hitSlop?: number;
};

export const IconButton = ({
  icon,
  onPress,
  accessibilityLabel,
  badge,
  style,
  hitSlop = 8,
}: IconButtonProps) => {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={hitSlop}
      style={({ pressed }) => [
        {
          width: 38,
          height: 38,
          borderRadius: 19,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: pressed ? colors.pillBg : "transparent",
        },
        style,
      ]}
    >
      {icon}
      {badge && badge > 0 ? (
        <View
          style={{
            position: "absolute",
            top: 4,
            right: 3,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            paddingHorizontal: 3,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AppText variant="mono" weight="bold" size={9} tone="inverse">
            {badge > 9 ? "9+" : badge}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
};
