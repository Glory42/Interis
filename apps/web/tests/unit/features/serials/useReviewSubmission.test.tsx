import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useReviewSubmission } from "@/features/serials/hooks/serials/use-review-submission";
import { useReviewDraft } from "@/features/serials/hooks/serials/use-review-draft";

const buildEvent = () =>
  ({ preventDefault: () => {} }) as unknown as React.FormEvent<HTMLFormElement>;

describe("useReviewSubmission", () => {
  it("rejects an empty draft without calling saveReview", async () => {
    const saveReview = vi.fn();
    const onClose = vi.fn();

    const { result } = renderHook(() => {
      const draft = useReviewDraft();
      const submission = useReviewSubmission({
        draft,
        saveReview,
        deleteReview: vi.fn(),
        onClose,
      });
      return { draft, submission };
    });

    await act(async () => {
      await result.current.submission.handleSubmit(buildEvent());
    });

    expect(saveReview).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(result.current.submission.formError).toBe(
      "Please write a review before saving.",
    );
  });

  it("trims the draft, saves, and closes on success", async () => {
    const saveReview = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    const { result } = renderHook(() => {
      const draft = useReviewDraft();
      const submission = useReviewSubmission({
        draft,
        saveReview,
        deleteReview: vi.fn(),
        onClose,
      });
      return { draft, submission };
    });

    act(() => result.current.draft.onContentChange("  great season  "));

    await act(async () => {
      await result.current.submission.handleSubmit(buildEvent());
    });

    expect(saveReview).toHaveBeenCalledWith({
      content: "great season",
      containsSpoilers: false,
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("sets a formError and does not close when saveReview rejects", async () => {
    const saveReview = vi.fn().mockRejectedValue(new Error("boom"));
    const onClose = vi.fn();

    const { result } = renderHook(() => {
      const draft = useReviewDraft();
      const submission = useReviewSubmission({
        draft,
        saveReview,
        deleteReview: vi.fn(),
        onClose,
      });
      return { draft, submission };
    });

    act(() => result.current.draft.onContentChange("great season"));

    await act(async () => {
      await result.current.submission.handleSubmit(buildEvent());
    });

    expect(result.current.submission.formError).toBe(
      "Failed to save the review. Please try again.",
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls deleteReview then onClose on delete", async () => {
    const deleteReview = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    const { result } = renderHook(() => {
      const draft = useReviewDraft();
      return useReviewSubmission({
        draft,
        saveReview: vi.fn(),
        deleteReview,
        onClose,
      });
    });

    await act(async () => {
      await result.current.handleDelete();
    });

    expect(deleteReview).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("start() fills the draft from the review being edited, or clears it", () => {
    const { result } = renderHook(() => useReviewDraft());

    act(() => result.current.start({ content: "first take", containsSpoilers: true }));
    expect([result.current.content, result.current.containsSpoilers]).toEqual(["first take", true]);

    act(() => result.current.start(null));
    expect([result.current.content, result.current.containsSpoilers]).toEqual(["", false]);
  });

  it("close() clears formError and calls onClose", async () => {
    const saveReview = vi.fn();
    const onClose = vi.fn();

    const { result } = renderHook(() => {
      const draft = useReviewDraft();
      const submission = useReviewSubmission({
        draft,
        saveReview,
        deleteReview: vi.fn(),
        onClose,
      });
      return submission;
    });

    await act(async () => {
      await result.current.handleSubmit(buildEvent());
    });
    expect(result.current.formError).not.toBeNull();

    act(() => result.current.close());

    expect(result.current.formError).toBeNull();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
