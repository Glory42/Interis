import { AppState, Platform, type AppStateStatus } from "react-native";
import { focusManager, QueryClient } from "@tanstack/react-query";
import { isApiError } from "@/api/client";

// React Native has no window "focus" event; treat the app coming back to the
// foreground as focus so stale queries refetch then. This replaces polling
// entirely (see CLAUDE.md: no refetchInterval against DB-backed endpoints).
const onAppStateChange = (status: AppStateStatus) => {
  if (Platform.OS !== "web") {
    focusManager.setFocused(status === "active");
  }
};

export const subscribeToAppFocus = () => {
  const subscription = AppState.addEventListener("change", onAppStateChange);
  return () => subscription.remove();
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        if (isApiError(error) && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
