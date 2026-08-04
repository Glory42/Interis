import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LogMediaDialog } from "@/features/diary/components/log-media/LogMediaDialog";

// LogMediaDialog is a "dumb" presentational component - all form state and
// validation lives in whichever parent wires it up (movie/serial/season/
// episode log flows), so what's worth testing here is prop-to-DOM wiring:
// every callback fires with the right value, and the two mutually-
// exclusive top-row modes (date+rewatch vs. simple watched-toggle) render
// correctly based on which props are passed.
const baseProps = {
  title: "Fight Club",
  posterUrl: "/poster.jpg",
  rating: null,
  liked: false,
  review: "",
  containsSpoilers: false,
  formError: null,
  reviewMaxLength: 5000,
  reviewPlaceholder: "Write your review...",
  isSubmitting: false,
  onClose: vi.fn(),
  onSubmit: vi.fn((event: React.FormEvent<HTMLFormElement>) => event.preventDefault()),
  onRatingChange: vi.fn(),
  onLikedChange: vi.fn(),
  onReviewChange: vi.fn(),
  onContainsSpoilersChange: vi.fn(),
};

describe("LogMediaDialog", () => {
  it("renders the title and year in the header subtitle", () => {
    render(<LogMediaDialog {...baseProps} year={1999} yearDescriptionLabel="Released" />);
    expect(screen.getByText("Fight Club (1999)")).toBeInTheDocument();
  });

  it("prefers an explicit subtitle over the year when both are given", () => {
    render(<LogMediaDialog {...baseProps} year={1999} subtitle="Season 2" />);
    expect(screen.getByText("Fight Club · Season 2")).toBeInTheDocument();
  });

  it("calls onClose from both the X button and the Cancel button", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<LogMediaDialog {...baseProps} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Close review modal" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("toggles liked via onLikedChange with the inverse of the current value", async () => {
    const user = userEvent.setup();
    const onLikedChange = vi.fn();
    render(<LogMediaDialog {...baseProps} liked={false} onLikedChange={onLikedChange} />);

    await user.click(screen.getByRole("button", { name: "Like" }));
    expect(onLikedChange).toHaveBeenCalledWith(true);
  });

  it("calls onContainsSpoilersChange when the spoilers checkbox is toggled", async () => {
    const user = userEvent.setup();
    const onContainsSpoilersChange = vi.fn();
    render(
      <LogMediaDialog
        {...baseProps}
        containsSpoilers={false}
        onContainsSpoilersChange={onContainsSpoilersChange}
      />,
    );

    await user.click(screen.getByRole("checkbox", { name: /contains spoilers/i }));
    expect(onContainsSpoilersChange).toHaveBeenCalledWith(true);
  });

  it("calls onReviewChange as the review textarea is typed into, and applies reviewMaxLength", async () => {
    const user = userEvent.setup();
    const onReviewChange = vi.fn();
    render(<LogMediaDialog {...baseProps} reviewMaxLength={10} onReviewChange={onReviewChange} />);

    const textarea = screen.getByPlaceholderText("Write your review...");
    expect(textarea).toHaveAttribute("maxlength", "10");

    // `review` is a controlled prop that this test never updates, so the
    // DOM value resets to "" after each keystroke - each call reports
    // just that one new character, not accumulated text.
    await user.type(textarea, "hi");
    expect(onReviewChange).toHaveBeenNthCalledWith(1, "h");
    expect(onReviewChange).toHaveBeenNthCalledWith(2, "i");
  });

  it("renders the date+rewatch mode when watchedDate is provided", () => {
    render(
      <LogMediaDialog
        {...baseProps}
        watchedDate="2026-01-01"
        onWatchedDateChange={vi.fn()}
        rewatch={false}
        onRewatchChange={vi.fn()}
      />,
    );
    expect(screen.getByText("I've watched this before")).toBeInTheDocument();
    expect(screen.queryByText("Mark as Watched")).not.toBeInTheDocument();
  });

  it("renders the simple watched-toggle mode when watched is provided instead", async () => {
    const user = userEvent.setup();
    const onWatchedChange = vi.fn();
    render(<LogMediaDialog {...baseProps} watched={false} onWatchedChange={onWatchedChange} />);

    expect(screen.getByText("Mark as Watched")).toBeInTheDocument();
    expect(screen.queryByText("I've watched this before")).not.toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: /mark as watched/i }));
    expect(onWatchedChange).toHaveBeenCalledWith(true);
  });

  it("renders neither top-row mode when neither watchedDate nor watched is provided", () => {
    render(<LogMediaDialog {...baseProps} />);
    expect(screen.queryByText("Mark as Watched")).not.toBeInTheDocument();
    expect(screen.queryByText("I've watched this before")).not.toBeInTheDocument();
  });

  it("only renders the Delete button when onDelete is provided, and it's disabled while submitting", () => {
    const { rerender } = render(<LogMediaDialog {...baseProps} />);
    expect(screen.queryByRole("button", { name: "Delete Review" })).not.toBeInTheDocument();

    const onDelete = vi.fn();
    rerender(<LogMediaDialog {...baseProps} onDelete={onDelete} isSubmitting />);
    expect(screen.getByRole("button", { name: "Delete Review" })).toBeDisabled();
  });

  it("calls onSubmit when the form is submitted via the submit button", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => event.preventDefault());
    render(<LogMediaDialog {...baseProps} onSubmit={onSubmit} submitLabel="Log Film" />);

    await user.click(screen.getByRole("button", { name: "Log Film" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("disables the submit button and shows 'Saving...' while isSubmitting", () => {
    render(<LogMediaDialog {...baseProps} isSubmitting submitLabel="Log Film" />);
    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Log Film" })).not.toBeInTheDocument();
  });

  it("shows the form error as an alert when present, and shows nothing when absent", () => {
    const { rerender } = render(<LogMediaDialog {...baseProps} formError="Rating is required" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Rating is required");

    rerender(<LogMediaDialog {...baseProps} formError={null} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
