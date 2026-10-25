import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { server } from "../../../support/msw/server";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { movieKeys } from "@/features/movies/hooks/useMovies";
import { profileKeys } from "@/features/profile/hooks/useProfile";
import { useDeleteReview } from "@/features/reviews/hooks/useDeleteReview";

describe("useDeleteReview", () => {
  it("deletes the review and refreshes the author's profile and the title", async () => {
    let deleted = false;
    server.use(
      http.delete("*/api/reviews/review-1", () => {
        deleted = true;
        return HttpResponse.json({ success: true });
      }),
    );
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    queryClient.setQueryData(authKeys.me, { username: "cinefan" });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useDeleteReview(), { wrapper });
    await act(() => result.current.mutateAsync({ id: "review-1", mediaType: "movie", tmdbId: 550 }));

    expect(deleted).toBe(true);
    const invalidatedKeys = invalidate.mock.calls.map(([filters]) => filters?.queryKey);
    for (const key of [
      profileKeys.reviews("cinefan"),
      profileKeys.diary("cinefan"),
      movieKeys.detailViewRoot(550),
    ]) {
      expect(invalidatedKeys).toContainEqual(key);
    }
  });
});
