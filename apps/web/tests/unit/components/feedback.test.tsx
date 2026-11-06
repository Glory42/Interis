import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "@/components/ui/Toaster";
import { TickLoader } from "@/components/ui/tick-loader";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { clearToasts, showToast } from "@/lib/toast";

afterEach(() => {
  act(() => clearToasts());
});

describe("feedback", () => {
  it("runs a toast's Undo action and dismisses it", async () => {
    const onUndo = vi.fn();
    render(<Toaster />);
    act(() => {
      showToast("Removed from watchlist", null, {
        tone: "success",
        action: { label: "Undo", onClick: onUndo },
      });
    });

    await userEvent.click(screen.getByRole("button", { name: "Undo" }));

    expect(onUndo).toHaveBeenCalled();
    expect(screen.queryByText("Removed from watchlist")).not.toBeInTheDocument();
  });

  it("announces the tick loader as loading", () => {
    render(<TickLoader label="Loading" />);
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });

  it("offers the empty state's action to the owner only", () => {
    const action = { label: "Log a film", onClick: () => {} };
    const { rerender } = render(
      <EmptyState title="No diary yet" viewer="owner" ownerAction={action} />,
    );
    expect(screen.getByRole("button", { name: "Log a film" })).toBeInTheDocument();

    rerender(<EmptyState title="No diary yet" viewer="visitor" ownerAction={action} />);
    expect(screen.queryByRole("button", { name: "Log a film" })).not.toBeInTheDocument();
  });

  it("retries from the error state", async () => {
    const onRetry = vi.fn();
    render(<ErrorState title="Could not load the diary." onRetry={onRetry} />);

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalled();
  });
});
