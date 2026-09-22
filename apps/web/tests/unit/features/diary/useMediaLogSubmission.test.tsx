import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useMediaLogSubmission } from "@/features/diary/hooks/useMediaLogSubmission";
import { ApiError } from "@/lib/api-client";

const buildEvent = () =>
  ({ preventDefault: () => {} }) as unknown as React.FormEvent<HTMLFormElement>;

describe("useMediaLogSubmission", () => {
  it("prefills form fields from initialState when opened", () => {
    const onOpenChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ isOpen }) =>
        useMediaLogSubmission({
          isOpen,
          onOpenChange,
          initialState: {
            watchedDate: "2026-01-05",
            rating: 8,
            rewatch: true,
            reviewContent: "great film",
            containsSpoilers: true,
          },
          likedFromInteraction: false,
          submitLog: vi.fn(),
          updateLiked: vi.fn(),
        }),
      { initialProps: { isOpen: false } },
    );

    act(() => result.current.openModal());
    rerender({ isOpen: true });

    expect(result.current.watchedDate).toBe("2026-01-05");
    expect(result.current.rating).toBe(8);
    expect(result.current.rewatch).toBe(true);
    expect(result.current.review).toBe("great film");
    expect(result.current.containsSpoilers).toBe(true);
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("falls back to likedFromInteraction until the user manually overrides it", () => {
    const { result, rerender } = renderHook(
      ({ likedFromInteraction }) =>
        useMediaLogSubmission({
          isOpen: true,
          onOpenChange: vi.fn(),
          likedFromInteraction,
          submitLog: vi.fn(),
          updateLiked: vi.fn(),
        }),
      { initialProps: { likedFromInteraction: false } },
    );

    expect(result.current.liked).toBe(false);

    rerender({ likedFromInteraction: true });
    expect(result.current.liked).toBe(true);

    act(() => result.current.setLikedOverride(false));
    rerender({ likedFromInteraction: true });
    expect(result.current.liked).toBe(false);
  });

  it("submits both mutations and closes on success", async () => {
    const submitLog = vi.fn().mockResolvedValue(undefined);
    const updateLiked = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();

    const { result } = renderHook(() =>
      useMediaLogSubmission({
        isOpen: true,
        onOpenChange,
        likedFromInteraction: true,
        submitLog,
        updateLiked,
      }),
    );

    act(() => result.current.setReview("  loved it  "));
    act(() => result.current.setRating(9));

    await act(async () => {
      await result.current.handleSubmit(buildEvent());
    });

    expect(submitLog).toHaveBeenCalledWith(
      expect.objectContaining({ rating: 9, review: "loved it", containsSpoilers: false }),
    );
    expect(updateLiked).toHaveBeenCalledWith(true);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(result.current.formError).toBeNull();
  });

  it("omits review/containsSpoilers from the submit payload when the review is blank", async () => {
    const submitLog = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useMediaLogSubmission({
        isOpen: true,
        onOpenChange: vi.fn(),
        likedFromInteraction: false,
        submitLog,
        updateLiked: vi.fn().mockResolvedValue(undefined),
      }),
    );

    await act(async () => {
      await result.current.handleSubmit(buildEvent());
    });

    const payload = submitLog.mock.calls[0]?.[0];
    expect(payload).not.toHaveProperty("review");
    expect(payload).not.toHaveProperty("containsSpoilers");
  });

  it("surfaces an ApiError's message as formError and keeps the modal open", async () => {
    const submitLog = vi.fn().mockRejectedValue(new ApiError(422, "Watched date is required.", null));
    const onOpenChange = vi.fn();

    const { result } = renderHook(() =>
      useMediaLogSubmission({
        isOpen: true,
        onOpenChange,
        likedFromInteraction: false,
        submitLog,
        updateLiked: vi.fn().mockResolvedValue(undefined),
      }),
    );

    await act(async () => {
      await result.current.handleSubmit(buildEvent());
    });

    expect(result.current.formError).toBe("Watched date is required.");
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("falls back to a generic formError for a non-ApiError failure", async () => {
    const submitLog = vi.fn().mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() =>
      useMediaLogSubmission({
        isOpen: true,
        onOpenChange: vi.fn(),
        likedFromInteraction: false,
        submitLog,
        updateLiked: vi.fn().mockResolvedValue(undefined),
      }),
    );

    await act(async () => {
      await result.current.handleSubmit(buildEvent());
    });

    expect(result.current.formError).toBe("Could not save this review right now.");
  });

  it("tracks isSubmitting for the duration of the submit", async () => {
    let resolveSubmit: () => void = () => {};
    const submitLog = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        }),
    );

    const { result } = renderHook(() =>
      useMediaLogSubmission({
        isOpen: true,
        onOpenChange: vi.fn(),
        likedFromInteraction: false,
        submitLog,
        updateLiked: vi.fn().mockResolvedValue(undefined),
      }),
    );

    let submitPromise!: Promise<void>;
    act(() => {
      submitPromise = result.current.handleSubmit(buildEvent());
    });

    expect(result.current.isSubmitting).toBe(true);

    await act(async () => {
      resolveSubmit();
      await submitPromise;
    });

    expect(result.current.isSubmitting).toBe(false);
  });
});
