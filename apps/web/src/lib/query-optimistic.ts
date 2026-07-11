import type { QueryClient } from "@tanstack/react-query";

export type QuerySnapshot = Array<[readonly unknown[], unknown]>;

// Restores every [queryKey, data] pair captured via queryClient.getQueriesData
// before an optimistic patch - the standard onError rollback step shared by
// every optimistic mutation in the app.
export const restoreQueries = (queryClient: QueryClient, snapshot: QuerySnapshot): void => {
  for (const [key, data] of snapshot) {
    queryClient.setQueryData(key, data);
  }
};
