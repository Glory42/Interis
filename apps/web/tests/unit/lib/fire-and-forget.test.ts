import { describe, expect, it, vi } from "vitest";
import { runDialogSubmit } from "@/lib/fire-and-forget";

describe("runDialogSubmit", () => {
  it("resolves true and runs the submit body when it succeeds", async () => {
    const onSuccess = vi.fn();

    const result = await runDialogSubmit(async () => {
      onSuccess();
    });

    expect(result).toBe(true);
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it("swallows a rejection and resolves false instead of throwing", async () => {
    const result = await runDialogSubmit(async () => {
      throw new Error("mutation failed");
    });

    expect(result).toBe(false);
  });

  it("never rejects, even when called fire-and-forget with `void`", () => {
    // The whole point: a `void runDialogSubmit(...)` call site must never
    // produce an unhandled promise rejection, no matter what the submit
    // body throws.
    expect(() => {
      void runDialogSubmit(async () => {
        throw new Error("boom");
      });
    }).not.toThrow();
  });
});
