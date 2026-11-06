import { Pressable, ScrollView } from "react-native";
import { useTheme } from "@/theme";
import { AppText } from "./AppText";

export type ChipOption<T extends string> = { value: T; label: string };

type ChipRowProps<T extends string> = {
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accentColor?: string;
};

export const ChipRow = <T extends string>({
  options,
  value,
  onChange,
  accentColor,
}: ChipRowProps<T>) => {
  const { colors } = useTheme();
  const accent = accentColor ?? colors.primary;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            style={{
              paddingHorizontal: 12,
              height: 30,
              justifyContent: "center",
              borderRadius: 999,
              borderWidth: 1,
              borderColor: isActive ? accent : colors.surfaceBorder,
              backgroundColor: isActive ? colors.pillBg : "transparent",
            }}
          >
            <AppText variant="mono" size={11} weight="bold" color={isActive ? accent : colors.mutedForeground}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};
