import { Stack, useLocalSearchParams } from "expo-router";
import { Screen } from "@/components/ui";
import { ProfileScreen } from "./ProfileScreen";

export const UserScreen = () => {
  const { username } = useLocalSearchParams<{ username: string }>();

  return (
    <Screen>
      <Stack.Screen options={{ title: `@${username}` }} />
      <ProfileScreen username={username} />
    </Screen>
  );
};
