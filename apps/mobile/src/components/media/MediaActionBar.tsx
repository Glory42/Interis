import { Pressable, View } from "react-native";
import type { ReactNode } from "react";
import { useTheme } from "@/theme";
import { AppText } from "@/components/ui";

export type MediaAction = {
  key: string;
  label: string;
  activeLabel: string;
  isActive: boolean;
  icon: (color: string) => ReactNode;
  onPress: () => void;
};

type MediaActionBarProps = {
  actions: MediaAction[];
  accentColor: string;
  disabled?: boolean;
};

// The web's MediaActionsSidebar laid out as an equal-width row of toggles.
export const MediaActionBar = ({ actions, accentColor, disabled = false }: MediaActionBarProps) => {
  const { colors, radius } = useTheme();

  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {actions.map((action) => {
        const color = action.isActive ? accentColor : colors.mutedForeground;
        return (
          <Pressable
            key={action.key}
            disabled={disabled}
            onPress={action.onPress}
            accessibilityRole="button"
            accessibilityState={{ selected: action.isActive, disabled }}
            style={({ pressed }) => ({
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingVertical: 12,
              borderRadius: radius,
              borderWidth: 1,
              borderColor: action.isActive ? accentColor : colors.surfaceBorder,
              backgroundColor: action.isActive ? colors.pillBg : colors.surfaceCard,
              opacity: disabled ? 0.6 : pressed ? 0.85 : 1,
            })}
          >
            {action.icon(color)}
            <AppText variant="kicker" size={9} color={color}>
              {action.isActive ? action.activeLabel : action.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
};
