import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UnwatchFilmDialog } from "@/features/films/components/film-detail/UnwatchFilmDialog";

describe("UnwatchFilmDialog", () => {
  it("keeps the like and rating unless the box is ticked", async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(<UnwatchFilmDialog onConfirm={onConfirm} onClose={() => {}} />);

    await user.click(screen.getByRole("button", { name: "Mark not watched" }));
    expect(onConfirm).toHaveBeenLastCalledWith(false);
  });

  it("asks to clear the like and rating when the box is ticked", async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(<UnwatchFilmDialog onConfirm={onConfirm} onClose={() => {}} />);

    await user.click(screen.getByRole("checkbox", { name: /remove your like and rating/i }));
    await user.click(screen.getByRole("button", { name: "Mark not watched" }));
    expect(onConfirm).toHaveBeenLastCalledWith(true);
  });
});
