import { Pressable, ScrollView, View } from "react-native";
import { useTheme } from "@/theme";
import { AppText } from "./AppText";

export type SegmentedTab<T extends string> = {
  id: T;
  label: string;
  color?: string;
};

type SegmentedTabsProps<T extends string> = {
  tabs: SegmentedTab<T>[];
  activeId: T;
  onChange: (id: T) => void;
  scrollable?: boolean;
};

// Mirrors the web's FeedFilterTabs / ProfileTabs: kicker-style labels with a
// colored underline under the active tab.
export const SegmentedTabs = <T extends string>({
  tabs,
  activeId,
  onChange,
  scrollable = false,
}: SegmentedTabsProps<T>) => {
  const { colors } = useTheme();

  const content = tabs.map((tab) => {
    const isActive = tab.id === activeId;
    const accent = tab.color ?? colors.primary;

    return (
      <Pressable
        key={tab.id}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive }}
        onPress={() => onChange(tab.id)}
        style={{ paddingVertical: 10, paddingHorizontal: 4, marginRight: 18 }}
      >
        <AppText variant="kicker" size={11} color={isActive ? colors.foreground : colors.mutedForeground}>
          {tab.label}
        </AppText>
        <View
          style={{
            marginTop: 8,
            height: 2,
            borderRadius: 1,
            backgroundColor: isActive ? accent : "transparent",
          }}
        />
      </Pressable>
    );
  });

  const containerStyle = {
    borderBottomWidth: 1,
    borderBottomColor: colors.rowBorder,
  };

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={containerStyle}
        contentContainerStyle={{ paddingRight: 8 }}
      >
        {content}
      </ScrollView>
    );
  }

  return <View style={[containerStyle, { flexDirection: "row" }]}>{content}</View>;
};
