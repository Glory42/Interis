import { useState } from "react";
import { Pressable } from "react-native";
import { TriangleAlert } from "lucide-react-native";
import { withAlpha } from "@/lib/color";
import { useTheme } from "@/theme";
import { AppText } from "@/components/ui";

type SpoilerGateProps = {
  containsSpoilers: boolean;
  content: string;
  numberOfLines?: number;
};

// Spoiler reviews stay hidden behind an amber pill until tapped (same as the
// web's ReviewActivityCard).
export const SpoilerGate = ({ containsSpoilers, content, numberOfLines }: SpoilerGateProps) => {
  const { colors } = useTheme();
  const [isRevealed, setIsRevealed] = useState(false);

  if (containsSpoilers && !isRevealed) {
    return (
      <Pressable
        onPress={() => setIsRevealed(true)}
        style={{
          marginTop: 8,
          alignSelf: "flex-start",
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: withAlpha(colors.spoiler, 0.4),
          backgroundColor: withAlpha(colors.spoiler, 0.1),
        }}
      >
        <TriangleAlert size={13} color={colors.spoiler} />
        <AppText size={12} weight="medium" color={colors.spoiler}>
          Contains spoilers — reveal
        </AppText>
      </Pressable>
    );
  }

  return (
    <AppText size={15} style={{ marginTop: 8 }} numberOfLines={numberOfLines}>
      {content}
    </AppText>
  );
};
