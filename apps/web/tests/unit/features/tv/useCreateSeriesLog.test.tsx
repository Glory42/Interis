import { describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { feedKeys } from "@/features/feed/hooks/useFeed";
import { profileKeys } from "@/features/profile/hooks/useProfile";
import { profileStatsKeys } from "@/features/profile/hooks/useProfileStats";
import { seriesKeys } from "@/features/tv/hooks/tv/query-keys";
import { useCreateSeriesLog } from "@/features/tv/hooks/useTv";

describe("useCreateSeriesLog", () => {
  it("refreshes the episodes, logs, feed and the viewer's profile (#97)", async () => {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    queryClient.setQueryData(authKeys.me, { username: "cinefan" });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCreateSeriesLog(1399), { wrapper });
    await act(() => result.current.mutateAsync({ watchedDate: "2026-03-01" }));

    const invalidatedKeys = invalidate.mock.calls.map(([filters]) => filters?.queryKey);
    for (const key of [
      seriesKeys.interaction(1399),
      seriesKeys.seasonDetailRoot(1399),
      seriesKeys.logs(1399),
      seriesKeys.myLogs,
      profileKeys.detail("cinefan"),
      profileKeys.diary("cinefan"),
      profileKeys.currentlyWatching("cinefan"),
      profileStatsKeys.detail("cinefan"),
      feedKeys.groupedRoot,
    ]) {
      expect(invalidatedKeys).toContainEqual(key);
    }
  });
});
