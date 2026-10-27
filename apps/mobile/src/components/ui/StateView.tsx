import { ActivityIndicator, View, type StyleProp, type ViewStyle } from "react-native";
import type { ReactNode } from "react";
import { useTheme } from "@/theme";
import { AppText } from "./AppText";
import { Button } from "./Button";

type StateViewProps = {
  title?: string;
  message?: string;
  icon?: ReactNode;
  action?: { label: string; onPress: () => void };
  style?: StyleProp<ViewStyle>;
};

export const LoadingView = ({ style }: { style?: StyleProp<ViewStyle> }) => {
  const { colors } = useTheme();
  return (
    <View style={[{ paddingVertical: 48, alignItems: "center" }, style]}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
};

export const EmptyView = ({ title, message, icon, action, style }: StateViewProps) => (
  <View style={[{ paddingVertical: 40, paddingHorizontal: 24, alignItems: "center", gap: 10 }, style]}>
    {icon}
    {title ? (
      <AppText variant="display" size={18} align="center">
        {title}
      </AppText>
    ) : null}
    {message ? (
      <AppText tone="muted" size={14} align="center">
        {message}
      </AppText>
    ) : null}
    {action ? (
      <Button label={action.label} onPress={action.onPress} variant="outline" size="sm" style={{ marginTop: 6 }} />
    ) : null}
  </View>
);

export const ErrorView = ({
  message = "Could not load this right now.",
  onRetry,
  style,
}: {
  message?: string;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
}) => (
  <EmptyView
    title="Something went wrong"
    message={message}
    action={onRetry ? { label: "Try again", onPress: onRetry } : undefined}
    style={style}
  />
);
