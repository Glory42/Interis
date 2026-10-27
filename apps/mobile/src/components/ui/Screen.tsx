import { View, type StyleProp, type ViewStyle } from "react-native";
import type { ReactNode } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme";

type ScreenProps = {
  children: ReactNode;
  // Tab screens draw their own header and need the top inset; stack screens
  // get it from the native header.
  withTopInset?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const Screen = ({ children, withTopInset = false, style }: ScreenProps) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        { flex: 1, backgroundColor: colors.background, paddingTop: withTopInset ? insets.top : 0 },
        style,
      ]}
    >
      {children}
    </View>
  );
};
