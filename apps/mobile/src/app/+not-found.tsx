import { useRouter } from "expo-router";
import { EmptyView, Screen } from "@/components/ui";

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <Screen>
      <EmptyView
        title="Page not found"
        message="This screen doesn't exist."
        action={{ label: "Go home", onPress: () => router.replace("/") }}
        style={{ paddingTop: 80 }}
      />
    </Screen>
  );
}
