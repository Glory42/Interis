import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MapPin } from "lucide-react-native";
import { withAlpha } from "@/lib/color";
import { useTheme } from "@/theme";
import type { PublicProfile } from "@/types/profile";
import { AppText, Avatar, Button } from "@/components/ui";

type ProfileHeaderProps = {
  profile: PublicProfile;
  isOwnProfile: boolean;
  isFollowing: boolean;
  isFollowPending: boolean;
  canFollow: boolean;
  onToggleFollow: () => void;
};

const Stat = ({ value, label, onPress }: { value: number; label: string; onPress?: () => void }) => (
  <Pressable onPress={onPress} disabled={!onPress} hitSlop={6} style={{ alignItems: "center", minWidth: 56 }}>
    <AppText variant="display" size={18}>
      {value}
    </AppText>
    <AppText variant="kicker" size={8} tone="muted">
      {label}
    </AppText>
  </Pressable>
);

// Mobile ProfileHeaderCompact: gradient glow, avatar, name, bio, stat strip.
export const ProfileHeader = ({
  profile,
  isOwnProfile,
  isFollowing,
  isFollowPending,
  canFollow,
  onToggleFollow,
}: ProfileHeaderProps) => {
  const router = useRouter();
  const { colors } = useTheme();
  const stats = profile.stats;
  const displayName = profile.displayUsername ?? profile.username;

  const openFollowList = (kind: "followers" | "following") =>
    router.push({ pathname: "/user/[username]/follows", params: { username: profile.username, kind } });

  return (
    <View>
      <LinearGradient
        colors={[colors.glow, withAlpha(colors.accent, 0.08), "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", left: 0, right: 0, top: 0, height: 180 }}
      />
      <View style={{ paddingHorizontal: 16, paddingTop: 20, gap: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <Avatar username={profile.username} avatarUrl={profile.avatarUrl} size={76} />
          <View style={{ flex: 1 }}>
            <AppText variant="display" size={24} numberOfLines={1}>
              {displayName}
            </AppText>
            <AppText variant="mono" size={12} tone="muted">
              @{profile.username}
            </AppText>
            {profile.location ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                <MapPin size={12} color={colors.mutedForeground} />
                <AppText size={12} tone="muted">
                  {profile.location}
                </AppText>
              </View>
            ) : null}
          </View>
        </View>

        {profile.bio ? <AppText size={14}>{profile.bio}</AppText> : null}

        {profile.favoriteGenres && profile.favoriteGenres.length > 0 ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {profile.favoriteGenres.map((genre) => (
              <View
                key={genre}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: colors.pillBorder,
                  backgroundColor: colors.pillBg,
                }}
              >
                <AppText variant="mono" size={10} tone="primary">
                  {genre}
                </AppText>
              </View>
            ))}
          </View>
        ) : null}

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingVertical: 12,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colors.rowBorder,
          }}
        >
          <Stat value={(stats?.movieEntryCount ?? 0) + (stats?.serialEntryCount ?? 0)} label="Logs" />
          <Stat value={stats?.reviewCount ?? 0} label="Reviews" />
          <Stat value={stats?.followerCount ?? 0} label="Followers" onPress={() => openFollowList("followers")} />
          <Stat value={stats?.followingCount ?? 0} label="Following" onPress={() => openFollowList("following")} />
        </View>

        {isOwnProfile ? (
          <Button label="Settings" variant="outline" size="sm" onPress={() => router.push("/settings")} />
        ) : canFollow ? (
          <Button
            label={isFollowing ? "Following" : "Follow"}
            variant={isFollowing ? "outline" : "primary"}
            size="sm"
            loading={isFollowPending}
            onPress={onToggleFollow}
          />
        ) : null}
      </View>
    </View>
  );
};
