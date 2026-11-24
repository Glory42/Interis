import { View } from "react-native";
import type { ReactNode } from "react";
import { useTheme } from "@/theme";
import { AppText } from "./AppText";

type TabHeaderProps = {
  kicker?: string;
  title: string;
  leading?: ReactNode;
  trailing?: ReactNode;
};

// Header drawn by tab screens themselves (tabs hide the native header), in
// the web navbar's style: brand/kicker on the left, actions on the right.
export const TabHeader = ({ kicker, title, leading, trailing }: TabHeaderProps) => {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.rowBorder,
      }}
    >
      {leading}
      <View style={{ flex: 1 }}>
        {kicker ? (
          <AppText variant="kicker" size={9} tone="primary">
            {kicker}
          </AppText>
        ) : null}
        <AppText variant="display" size={24}>
          {title}
        </AppText>
      </View>
      {trailing}
    </View>
  );
};
