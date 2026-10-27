import { Tabs } from "expo-router";
import { Clapperboard, Home, Search, Tv, User } from "lucide-react-native";
import { useTheme } from "@/theme";

export default function TabsLayout() {
  const { colors, fonts } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.shell,
          borderTopColor: colors.rowBorder,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.monoBold,
          fontSize: 9,
          letterSpacing: 1,
          textTransform: "uppercase",
        },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Feed", tabBarIcon: ({ color, size }) => <Home size={size - 2} color={color} /> }}
      />
      <Tabs.Screen
        name="movies"
        options={{
          title: "Movies",
          tabBarIcon: ({ color, size }) => <Clapperboard size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="serials"
        options={{ title: "Series", tabBarIcon: ({ color, size }) => <Tv size={size - 2} color={color} /> }}
      />
      <Tabs.Screen
        name="search"
        options={{ title: "Search", tabBarIcon: ({ color, size }) => <Search size={size - 2} color={color} /> }}
      />
      <Tabs.Screen
        name="me"
        options={{ title: "You", tabBarIcon: ({ color, size }) => <User size={size - 2} color={color} /> }}
      />
    </Tabs>
  );
}
