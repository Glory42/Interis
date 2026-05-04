import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api-client";

const shouldRetry = (failureCount: number, error: unknown): boolean => {
  if (error instanceof ApiError) {
    if ([400, 401, 403, 404, 422].includes(error.status)) {
      return false;
    }
  }

  return failureCount < 2;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 10 * 60_000,
      retry: shouldRetry,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
