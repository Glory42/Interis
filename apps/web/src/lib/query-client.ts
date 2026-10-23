import { MutationCache, QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api-client";
import { showMutationErrorToast } from "./mutation-error-toast";

const shouldRetry = (failureCount: number, error: unknown): boolean => {
  // At most one retry, and none on a 10s timeout: the server already did the work and
  // a retry only doubles the DB load while Neon is cold-starting.
  if (error instanceof ApiError) {
    if ([400, 401, 403, 404, 408, 422].includes(error.status)) {
      return false;
    }
  }

  return failureCount < 1;
};

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({ onError: showMutationErrorToast }),
  defaultOptions: {
    queries: {
      // Every request costs several DB round trips, so keep data fresh for a while and
      // don't refetch on reconnect (laptop wake / Wi-Fi flaps would fire with no one there).
      staleTime: 2 * 60_000,
      gcTime: 10 * 60_000,
      retry: shouldRetry,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    mutations: {
      retry: false,
    },
  },
});
