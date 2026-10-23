import { afterEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { MutationCache, QueryClient, QueryClientProvider, useMutation } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../support/msw/server";
import { Toaster } from "@/components/ui/Toaster";
import { useUpdateSeasonInteraction } from "@/features/serials/hooks/serials/use-season-episode-interactions";
import { showMutationErrorToast } from "@/lib/mutation-error-toast";
import { clearToasts, showToast, useToasts } from "@/lib/toast";

const createTestQueryClient = (): QueryClient =>
  new QueryClient({
    mutationCache: new MutationCache({ onError: showMutationErrorToast }),
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const SeasonWatchedButton = () => {
  const mutation = useUpdateSeasonInteraction(1399);
  return (
    <button
      type="button"
      onClick={() => mutation.mutate({ seasonNumber: 1, input: { watched: true } })}
    >
      Mark watched
    </button>
  );
};

const FailingWithoutMeta = () => {
  const mutation = useMutation({
    mutationFn: () => Promise.reject(new Error("boom")),
  });
  return (
    <button type="button" onClick={() => mutation.mutate()}>
      Fail quietly
    </button>
  );
};

const renderWithToaster = (ui: React.ReactNode) =>
  render(
    <QueryClientProvider client={createTestQueryClient()}>
      {ui}
      <Toaster />
    </QueryClientProvider>,
  );

const ToastCount = () => <span data-testid="count">{useToasts().length}</span>;

afterEach(() => {
  // Toasts live in a module-level store, so clear them between tests.
  act(() => clearToasts());
  vi.useRealTimers();
});

describe("mutation error toast", () => {
  it("tells the user why a season toggle was rolled back", async () => {
    const user = userEvent.setup();
    server.use(
      http.put("*/api/serials/1399/seasons/1/interaction", () =>
        HttpResponse.json(
          { error: { message: "Couldn't load this season's episodes right now. Please try again." } },
          { status: 503 },
        ),
      ),
    );
    renderWithToaster(<SeasonWatchedButton />);

    await user.click(screen.getByRole("button", { name: "Mark watched" }));

    const toast = await screen.findByRole("status");
    expect(toast.textContent).toContain("Couldn't update this season");
    expect(toast.textContent).toContain("Couldn't load this season's episodes right now.");
  });

  it("stays quiet for mutations that handle their own errors", async () => {
    const user = userEvent.setup();
    renderWithToaster(<FailingWithoutMeta />);

    await user.click(screen.getByRole("button", { name: "Fail quietly" }));

    await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
  });
});

describe("toast store", () => {
  it("replaces a repeated message instead of stacking it, and expires on its own", () => {
    vi.useFakeTimers();
    render(<ToastCount />);

    act(() => {
      showToast("Couldn't update this movie", "Unable to reach API server.");
      showToast("Couldn't update this movie", "Unable to reach API server.");
    });
    expect(screen.getByTestId("count").textContent).toBe("1");

    act(() => vi.advanceTimersByTime(6_000));
    expect(screen.getByTestId("count").textContent).toBe("0");
  });

  it("keeps at most three toasts, dropping the oldest", () => {
    render(<ToastCount />);

    act(() => {
      for (const n of [1, 2, 3, 4]) showToast(`Failure ${n}`);
    });
    expect(screen.getByTestId("count").textContent).toBe("3");
  });
});
