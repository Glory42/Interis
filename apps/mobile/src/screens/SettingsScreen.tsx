import { Alert, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Check } from "lucide-react-native";
import { API_BASE_URL } from "@/lib/config";
import { THEMES, THEME_IDS, useThemeContext } from "@/theme";
import { useAuth } from "@/hooks/useAuth";
import { useThemeSync } from "@/hooks/useThemeSync";
import { AppText, Button, Screen, SectionHeader, Surface } from "@/components/ui";

export const SettingsScreen = () => {
  const router = useRouter();
  const { theme, themeId } = useThemeContext();
  const { colors, radius } = theme;
  const { user, logout, isLogoutPending } = useAuth();
  const changeTheme = useThemeSync(user);

  const confirmLogout = () =>
    Alert.alert("Sign out?", "You can sign back in any time.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await logout().catch(() => undefined);
          router.dismissTo("/");
        },
      },
    ]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 22, paddingBottom: 48 }}>
        {user ? (
          <Surface>
            <SectionHeader label="Account" />
            <AppText variant="display" size={18}>
              @{user.username}
            </AppText>
            <AppText size={13} tone="muted">
              {user.email}
            </AppText>
          </Surface>
        ) : null}

        <View>
          <SectionHeader label="Theme" />
          <View style={{ gap: 10 }}>
            {THEME_IDS.map((id) => {
              const option = THEMES[id];
              const isActive = id === themeId;
              return (
                <Pressable
                  key={id}
                  onPress={() => changeTheme(id)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isActive }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
                    padding: 14,
                    borderRadius: radius,
                    borderWidth: 1,
                    borderColor: isActive ? colors.primary : colors.surfaceBorder,
                    backgroundColor: isActive ? colors.pillBg : colors.surfaceCard,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      borderRadius: 8,
                      overflow: "hidden",
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    {[option.colors.background, option.colors.primary, option.colors.accent].map((swatch) => (
                      <View key={swatch} style={{ width: 18, height: 28, backgroundColor: swatch }} />
                    ))}
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText weight="semibold">{option.label}</AppText>
                    <AppText size={12} tone="muted">
                      {option.mode === "dark" ? "Dark" : "Light"}
                    </AppText>
                  </View>
                  {isActive ? <Check size={18} color={colors.primary} /> : null}
                </Pressable>
              );
            })}
          </View>
          <AppText size={12} tone="faint" style={{ marginTop: 8 }}>
            {user ? "Synced with your account, so it matches the web app." : "Saved on this device."}
          </AppText>
        </View>

        {user ? (
          <Button label="Sign out" variant="danger" loading={isLogoutPending} onPress={confirmLogout} fullWidth />
        ) : (
          <Button label="Sign in" onPress={() => router.push("/login")} fullWidth />
        )}

        <AppText variant="mono" size={10} tone="faint" align="center">
          API · {API_BASE_URL}
        </AppText>
      </ScrollView>
    </Screen>
  );
};
