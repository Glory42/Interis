import { Pressable, View } from "react-native";
import { useTheme } from "@/theme";
import { AppText } from "./AppText";

type SectionHeaderProps = {
  label: string;
  color?: string;
  actionLabel?: string;
  onAction?: () => void;
};

// The web's "theme-kicker" section label: small mono caps in an accent color.
export const SectionHeader = ({ label, color, actionLabel, onAction }: SectionHeaderProps) => {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
      }}
    >
      <AppText variant="kicker" size={10} color={color ?? colors.primary}>
        {label}
      </AppText>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <AppText variant="kicker" size={9} tone="muted">
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
};
