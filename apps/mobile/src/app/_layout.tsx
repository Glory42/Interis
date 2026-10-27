import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { Sora_400Regular, Sora_500Medium, Sora_600SemiBold, Sora_700Bold } from "@expo-google-fonts/sora";
import { SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from "@expo-google-fonts/space-grotesk";
import { JetBrainsMono_500Medium, JetBrainsMono_700Bold } from "@expo-google-fonts/jetbrains-mono";
import { PlayfairDisplay_500Medium, PlayfairDisplay_700Bold } from "@expo-google-fonts/playfair-display";
import { queryClient, subscribeToAppFocus } from "@/lib/query-client";
import { ThemeProvider, loadStoredThemeId, useTheme, type ThemeId } from "@/theme";
import { useAuth } from "@/hooks/useAuth";
import { useThemeSync } from "@/hooks/useThemeSync";
import { Toaster } from "@/components/ui";

void SplashScreen.preventAutoHideAsync();

const RootNavigator = () => {
  const theme = useTheme();
  const { colors, fonts } = theme;
  const { user } = useAuth();
  useThemeSync(user);

  return (
    <>
      <StatusBar style={theme.mode === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerTransparent: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerTitleStyle: { fontFamily: fonts.displayBold, color: colors.foreground },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: "minimal",
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="movie/[tmdbId]" options={{ headerTransparent: true, title: "" }} />
        <Stack.Screen name="serial/[tmdbId]/index" options={{ headerTransparent: true, title: "" }} />
        <Stack.Screen name="serial/[tmdbId]/season/[seasonNumber]" options={{ title: "Season" }} />
        <Stack.Screen name="user/[username]/index" options={{ title: "Profile" }} />
        <Stack.Screen name="user/[username]/follows" options={{ title: "Followers" }} />
        <Stack.Screen name="review/[username]/[reviewId]" options={{ title: "Review" }} />
        <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
        <Stack.Screen name="login" options={{ presentation: "modal", title: "Sign in" }} />
        <Stack.Screen name="register" options={{ presentation: "modal", title: "Create account" }} />
        <Stack.Screen name="+not-found" options={{ title: "Not found" }} />
      </Stack>
      <Toaster />
    </>
  );
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_700Bold,
  });
  const [initialThemeId, setInitialThemeId] = useState<ThemeId | null>(null);

  useEffect(() => {
    void loadStoredThemeId().then(setInitialThemeId);
  }, []);

  useEffect(() => subscribeToAppFocus(), []);

  // A font that fails to load falls back to the system font rather than
  // blocking the app on the splash screen.
  const isReady = (fontsLoaded || Boolean(fontError)) && initialThemeId !== null;

  useEffect(() => {
    if (isReady) {
      void SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider initialThemeId={initialThemeId}>
          <RootNavigator />
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
