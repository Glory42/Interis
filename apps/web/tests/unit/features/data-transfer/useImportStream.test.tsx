import { describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { ImportStreamEvent } from "@/features/data-transfer/api";

// importDiaryStream drives its own fetch + ReadableStream parsing
// independent of apiRequest, so the cleanest way to control the exact
// event sequence for testing useImportStream's state machine is to mock
// the async generator itself rather than simulate a streaming HTTP body.
const importDiaryStreamMock = vi.fn();
vi.mock("@/features/data-transfer/api", () => ({
  importDiaryStream: (...args: unknown[]) => importDiaryStreamMock(...args),
}));

const { useImportStream } = await import("@/features/data-transfer/hooks/useImportStream");
const { diaryKeys } = await import("@/features/diary/hooks/useDiary");

const createTestQueryClient = (): QueryClient =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrapperFor = (queryClient: QueryClient) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

async function* eventsToAsyncGenerator(
  events: ImportStreamEvent[],
): AsyncGenerator<ImportStreamEvent> {
  for (const event of events) {
    yield event;
  }
}

const fakeFile = () => new File(["irrelevant"], "diary.csv", { type: "text/csv" });

describe("useImportStream", () => {
  it("starts idle", () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useImportStream(), { wrapper: wrapperFor(queryClient) });
    expect(result.current.state).toEqual({ phase: "idle" });
  });

  it("transitions idle -> running -> done, accumulating rows and the final summary", async () => {
    importDiaryStreamMock.mockReturnValueOnce(
      eventsToAsyncGenerator([
        { type: "start", total: 2, format: "Letterboxd diary" },
        { type: "row", title: "Fight Club", year: 1999, status: "imported" },
        { type: "row", title: "Unknown Movie", year: null, status: "failed", reason: "Not found" },
        { type: "done", total: 2, imported: 1, skipped: 0, failed: 1 },
      ]),
    );

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useImportStream(), { wrapper: wrapperFor(queryClient) });

    act(() => {
      void result.current.startImport(fakeFile());
    });

    await waitFor(() => expect(result.current.state.phase).toBe("running"));

    await waitFor(() => expect(result.current.state.phase).toBe("done"));

    const finalState = result.current.state;
    if (finalState.phase !== "done") throw new Error("expected done phase");
    expect(finalState.format).toBe("Letterboxd diary");
    expect(finalState.lines).toHaveLength(2);
    expect(finalState.lines[0]).toMatchObject({ title: "Fight Club", status: "imported" });
    expect(finalState.lines[1]).toMatchObject({ title: "Unknown Movie", status: "failed" });
    expect(finalState.summary).toEqual({ total: 2, imported: 1, skipped: 0, failed: 1 });
  });

  it("assigns each terminal line a unique, incrementing id across the whole run", async () => {
    importDiaryStreamMock.mockReturnValueOnce(
      eventsToAsyncGenerator([
        { type: "start", total: 3, format: "Letterboxd diary" },
        { type: "row", title: "A", year: null, status: "imported" },
        { type: "row", title: "B", year: null, status: "imported" },
        { type: "row", title: "C", year: null, status: "imported" },
        { type: "done", total: 3, imported: 3, skipped: 0, failed: 0 },
      ]),
    );

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useImportStream(), { wrapper: wrapperFor(queryClient) });

    act(() => {
      void result.current.startImport(fakeFile());
    });

    await waitFor(() => expect(result.current.state.phase).toBe("done"));

    const finalState = result.current.state;
    if (finalState.phase !== "done") throw new Error("expected done phase");
    expect(finalState.lines.map((l) => l.id)).toEqual([0, 1, 2]);
  });

  it("transitions to the error phase when the stream throws mid-run, without a done event", async () => {
    // eslint-disable-next-line require-yield
    async function* throwingStream(): AsyncGenerator<ImportStreamEvent> {
      throw new Error("Network dropped");
    }
    importDiaryStreamMock.mockReturnValueOnce(throwingStream());

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useImportStream(), { wrapper: wrapperFor(queryClient) });

    act(() => {
      void result.current.startImport(fakeFile());
    });

    await waitFor(() => expect(result.current.state.phase).toBe("error"));

    const finalState = result.current.state;
    if (finalState.phase !== "error") throw new Error("expected error phase");
    expect(finalState.message).toBe("Network dropped");
  });

  it("falls back to a generic error message for a non-Error throw", async () => {
    // eslint-disable-next-line require-yield
    async function* throwingStream(): AsyncGenerator<ImportStreamEvent> {
      throw "some string failure";
    }
    importDiaryStreamMock.mockReturnValueOnce(throwingStream());

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useImportStream(), { wrapper: wrapperFor(queryClient) });

    act(() => {
      void result.current.startImport(fakeFile());
    });

    await waitFor(() => expect(result.current.state.phase).toBe("error"));
    const finalState = result.current.state;
    if (finalState.phase !== "error") throw new Error("expected error phase");
    expect(finalState.message).toBe("Import failed.");
  });

  it("invalidates diaryKeys.all only once the stream reports done", async () => {
    let resolveRowsProcessed: () => void;
    const rowsProcessed = new Promise<void>((resolve) => {
      resolveRowsProcessed = resolve;
    });

    async function* controlledStream(): AsyncGenerator<ImportStreamEvent> {
      yield { type: "start", total: 1, format: "Letterboxd diary" };
      yield { type: "row", title: "Film", year: null, status: "imported" };
      resolveRowsProcessed();
      // Yield control back to the microtask queue so the assertion below
      // can observe the "no invalidation yet" state before done fires.
      await new Promise((resolve) => setTimeout(resolve, 10));
      yield { type: "done", total: 1, imported: 1, skipped: 0, failed: 0 };
    }
    importDiaryStreamMock.mockReturnValueOnce(controlledStream());

    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useImportStream(), { wrapper: wrapperFor(queryClient) });

    act(() => {
      void result.current.startImport(fakeFile());
    });

    await act(() => rowsProcessed);
    expect(invalidateSpy).not.toHaveBeenCalled();

    await waitFor(() => expect(result.current.state.phase).toBe("done"));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: diaryKeys.all });
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
  });

  it("reset() returns to idle from the done phase", async () => {
    importDiaryStreamMock.mockReturnValueOnce(
      eventsToAsyncGenerator([
        { type: "start", total: 0, format: "Letterboxd diary" },
        { type: "done", total: 0, imported: 0, skipped: 0, failed: 0 },
      ]),
    );

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useImportStream(), { wrapper: wrapperFor(queryClient) });

    act(() => {
      void result.current.startImport(fakeFile());
    });
    await waitFor(() => expect(result.current.state.phase).toBe("done"));

    act(() => {
      result.current.reset();
    });
    expect(result.current.state).toEqual({ phase: "idle" });
  });
});
