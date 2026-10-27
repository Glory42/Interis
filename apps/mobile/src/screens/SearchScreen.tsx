import { useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Search, X } from "lucide-react-native";
import { mediaHref, toReleaseYear } from "@/lib/media";
import { useTheme } from "@/theme";
import { useSearch } from "@/hooks/useSearch";
import { AppText, Avatar, EmptyView, LoadingView, Screen, SectionHeader, TabHeader } from "@/components/ui";
import { Poster } from "@/components/media/Poster";

export const SearchScreen = () => {
  const router = useRouter();
  const { colors, radius, fonts } = useTheme();
  const [rawQuery, setRawQuery] = useState("");
  const { enabled, titlesQuery, usersQuery } = useSearch(rawQuery);

  const titles = enabled ? (titlesQuery.data ?? []) : [];
  const users = enabled ? (usersQuery.data ?? []) : [];
  const isLoading = enabled && (titlesQuery.isPending || usersQuery.isPending);

  return (
    <Screen withTopInset>
      <TabHeader kicker="Find films, series & people" title="Search" />
      <View style={{ padding: 16 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            height: 46,
            paddingHorizontal: 14,
            borderRadius: radius,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.input,
          }}
        >
          <Search size={18} color={colors.mutedForeground} />
          <TextInput
            value={rawQuery}
            onChangeText={setRawQuery}
            placeholder="Search titles or @people"
            placeholderTextColor={colors.faint}
            selectionColor={colors.primary}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={{ flex: 1, color: colors.foreground, fontFamily: fonts.body, fontSize: 15 }}
          />
          {rawQuery ? (
            <Pressable hitSlop={8} onPress={() => setRawQuery("")} accessibilityLabel="Clear search">
              <X size={18} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 32, gap: 20 }}>
        {!enabled ? (
          <EmptyView
            icon={<Search size={28} color={colors.faint} />}
            title="Search Interis"
            message="Type at least two characters to search movies, series and members."
          />
        ) : isLoading ? (
          <LoadingView />
        ) : titles.length === 0 && users.length === 0 ? (
          <EmptyView title="No results" message={`Nothing matched “${rawQuery.trim()}”.`} />
        ) : null}

        {users.length > 0 ? (
          <View style={{ paddingHorizontal: 16 }}>
            <SectionHeader label="People" />
            {users.map((user) => (
              <Pressable
                key={user.id}
                onPress={() => router.push({ pathname: "/user/[username]", params: { username: user.username } })}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingVertical: 10,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Avatar username={user.username} avatarUrl={user.avatarUrl} size={36} />
                <View>
                  <AppText weight="semibold">{user.displayUsername ?? user.username}</AppText>
                  <AppText variant="mono" size={11} tone="muted">
                    @{user.username}
                  </AppText>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        {titles.length > 0 ? (
          <View style={{ paddingHorizontal: 16 }}>
            <SectionHeader label="Titles" />
            {titles.map((result) => {
              const accent = result.mediaType === "tv" ? colors.serial : colors.movie;
              return (
                <Pressable
                  key={`${result.mediaType}-${result.tmdbId}`}
                  onPress={() => router.push(mediaHref(result.mediaType, result.tmdbId))}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingVertical: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.rowBorder,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Poster posterPath={result.posterPath} width={44} size="w185" accentColor={accent} />
                  <View style={{ flex: 1 }}>
                    <AppText weight="semibold" numberOfLines={2}>
                      {result.title}
                    </AppText>
                    <View style={{ flexDirection: "row", gap: 8, marginTop: 2 }}>
                      <AppText variant="kicker" size={8} color={accent}>
                        {result.mediaType === "tv" ? "Serial" : "Movie"}
                      </AppText>
                      {toReleaseYear(result.releaseDate) ? (
                        <AppText size={12} tone="muted">
                          {toReleaseYear(result.releaseDate)}
                        </AppText>
                      ) : null}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
};
