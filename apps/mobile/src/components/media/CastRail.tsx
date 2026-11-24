import { FlatList, View } from "react-native";
import { Image } from "expo-image";
import { getProfileImageUrl } from "@/lib/media";
import { useTheme } from "@/theme";
import type { PersonLink } from "@/types/common";
import { AppText, Avatar, SectionHeader } from "@/components/ui";

export const CastRail = ({ label, people }: { label: string; people: PersonLink[] }) => {
  const { colors } = useTheme();

  if (people.length === 0) {
    return null;
  }

  return (
    <View>
      <View style={{ paddingHorizontal: 16 }}>
        <SectionHeader label={label} />
      </View>
      <FlatList
        horizontal
        data={people.slice(0, 20)}
        keyExtractor={(person) => `${person.tmdbPersonId}-${person.character ?? person.job ?? ""}`}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}
        renderItem={({ item }) => {
          const uri = getProfileImageUrl(item.profilePath);
          return (
            <View style={{ width: 72, alignItems: "center" }}>
              {uri ? (
                <Image
                  source={{ uri }}
                  style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: colors.secondary }}
                  contentFit="cover"
                />
              ) : (
                <Avatar username={item.name} size={60} />
              )}
              <AppText size={11} weight="semibold" numberOfLines={2} align="center" style={{ marginTop: 6 }}>
                {item.name}
              </AppText>
              {item.character || item.job ? (
                <AppText size={10} tone="muted" numberOfLines={1} align="center">
                  {item.character ?? item.job}
                </AppText>
              ) : null}
            </View>
          );
        }}
      />
    </View>
  );
};
