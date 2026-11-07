import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LogMediaDialog } from "@/features/diary/components/log-media/LogMediaDialog";

// Presentational: form state lives in the caller, so these check prop-to-DOM
// wiring on desktop and on a phone-width screen.
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

const dateProps = {
  watchedDate: "2026-01-01",
  onWatchedDateChange: vi.fn(),
  rewatch: false,
  onRewatchChange: vi.fn(),
};

const usePhoneWidth = () => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("max-width"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
};

afterEach(() => {
  vi.unstubAllGlobals();
});

const precedes = (first: Element, second: Element) =>
  Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);

describe("LogMediaDialog", () => {
  it("names what you're logging in the slate", () => {
    render(<LogMediaDialog {...baseProps} {...dateProps} accent="movie" year={1999} />);
    expect(screen.getByText("Log · Film · 1999")).toBeInTheDocument();
    expect(screen.getAllByText("Fight Club").length).toBeGreaterThan(0);
  });

  it("reads as a review of the season or episode when there's no watch date", () => {
    render(<LogMediaDialog {...baseProps} accent="serial" subtitle="Season 2" watched={false} onWatchedChange={vi.fn()} />);
    expect(screen.getByText("Review · TV · Season 2")).toBeInTheDocument();
  });

  it("says Save log until there's review text, then Post review", () => {
    const { rerender } = render(<LogMediaDialog {...baseProps} {...dateProps} />);
    expect(screen.getByRole("button", { name: "Save log" })).toBeInTheDocument();

    rerender(<LogMediaDialog {...baseProps} {...dateProps} review="Loved it" />);
    expect(screen.getByRole("button", { name: "Post review" })).toBeInTheDocument();
  });

  it("keeps an explicit submit label", () => {
    render(<LogMediaDialog {...baseProps} review="Loved it" submitLabel="Save" />);
    expect(screen.getByRole("button", { name: "Save", exact: true } as never)).toBeInTheDocument();
  });

  it("closes from the ✕ and from Cancel", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<LogMediaDialog {...baseProps} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Close review modal" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("switches first watch to rewatch in the date sentence", async () => {
    const user = userEvent.setup();
    const onRewatchChange = vi.fn();
    render(<LogMediaDialog {...baseProps} {...dateProps} onRewatchChange={onRewatchChange} />);

    const toggle = screen.getByRole("button", { name: "First watch" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    await user.click(toggle);
    expect(onRewatchChange).toHaveBeenCalledWith(true);
  });

  it("marks a season or episode watched", async () => {
    const user = userEvent.setup();
    const onWatchedChange = vi.fn();
    render(<LogMediaDialog {...baseProps} watched={false} onWatchedChange={onWatchedChange} />);

    await user.click(screen.getByRole("checkbox", { name: "Watched" }));
    expect(onWatchedChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole("button", { name: "First watch" })).not.toBeInTheDocument();
  });

  it("toggles like", async () => {
    const user = userEvent.setup();
    const onLikedChange = vi.fn();
    render(<LogMediaDialog {...baseProps} onLikedChange={onLikedChange} />);

    await user.click(screen.getByRole("button", { name: "Like" }));
    expect(onLikedChange).toHaveBeenCalledWith(true);
  });

  it("flags spoilers with a switch and counts characters", async () => {
    const user = userEvent.setup();
    const onContainsSpoilersChange = vi.fn();
    render(
      <LogMediaDialog {...baseProps} review="Loved it" onContainsSpoilersChange={onContainsSpoilersChange} />,
    );

    await user.click(screen.getByRole("switch", { name: "Contains spoilers" }));
    expect(onContainsSpoilersChange).toHaveBeenCalledWith(true);
    expect(screen.getByText("8 / 5000")).toBeInTheDocument();
  });

  it("caps the review at reviewMaxLength and reports typing", async () => {
    const user = userEvent.setup();
    const onReviewChange = vi.fn();
    render(<LogMediaDialog {...baseProps} reviewMaxLength={10} onReviewChange={onReviewChange} />);

    const textarea = screen.getByPlaceholderText("Write your review...");
    expect(textarea).toHaveAttribute("maxlength", "10");
    await user.type(textarea, "h");
    expect(onReviewChange).toHaveBeenCalledWith("h");
  });

  it("offers delete only when editing, disabled while saving", () => {
    const { rerender } = render(<LogMediaDialog {...baseProps} />);
    expect(screen.queryByRole("button", { name: "Delete review" })).not.toBeInTheDocument();

    rerender(<LogMediaDialog {...baseProps} onDelete={vi.fn()} isSubmitting />);
    expect(screen.getByRole("button", { name: "Delete review" })).toBeDisabled();
  });

  it("submits, and shows Saving… while it's in flight", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => event.preventDefault());
    const { rerender } = render(<LogMediaDialog {...baseProps} onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Save log" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);

    rerender(<LogMediaDialog {...baseProps} isSubmitting />);
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
  });

  it("shows the form error as an alert", () => {
    render(<LogMediaDialog {...baseProps} formError="Rating is required" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Rating is required");
  });

  it("puts the date picker inline and Save at the bottom on desktop", () => {
    render(<LogMediaDialog {...baseProps} {...dateProps} />);
    expect(screen.queryByLabelText("Watched on")).not.toBeInTheDocument();
    expect(
      precedes(screen.getByPlaceholderText("Write your review..."), screen.getByRole("button", { name: "Save log" })),
    ).toBe(true);
  });

  it("goes full screen on phones with Cancel and Save at the top and the native date picker", () => {
    usePhoneWidth();
    const onWatchedDateChange = vi.fn();
    render(<LogMediaDialog {...baseProps} {...dateProps} onWatchedDateChange={onWatchedDateChange} />);

    const save = screen.getByRole("button", { name: "Save" });
    expect(precedes(save, screen.getByPlaceholderText("Write your review..."))).toBe(true);
    expect(screen.queryByRole("button", { name: "Close review modal" })).not.toBeInTheDocument();

    const dateInput = screen.getByLabelText("Watched on");
    expect(dateInput).toHaveAttribute("type", "date");
    // The phone's picker hands back a whole date at once.
    fireEvent.change(dateInput, { target: { value: "2025-12-24" } });
    expect(onWatchedDateChange).toHaveBeenLastCalledWith("2025-12-24");
  });

  it("says Post on phones once there's review text", () => {
    usePhoneWidth();
    render(<LogMediaDialog {...baseProps} {...dateProps} review="Loved it" />);
    expect(screen.getByRole("button", { name: "Post" })).toBeInTheDocument();
  });
});
