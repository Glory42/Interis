import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebouncedValue } from "@/lib/use-debounced-value";

describe("useDebouncedValue", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("only settles on the last value once typing pauses", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 250), {
      initialProps: { value: "" },
    });

    rerender({ value: "br" });
    act(() => vi.advanceTimersByTime(100));
    rerender({ value: "bre" });
    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe("");

    act(() => vi.advanceTimersByTime(250));
    expect(result.current).toBe("bre");
  });
});
