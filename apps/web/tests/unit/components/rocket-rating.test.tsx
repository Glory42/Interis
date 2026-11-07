import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LaunchTrack } from "@/components/film/rating/LaunchTrack";
import { RocketDisplay } from "@/components/film/rating/RocketDisplay";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("LaunchTrack", () => {
  it("moves 0.5 per arrow key and saves once per key release", async () => {
    const onCommit = vi.fn();
    render(<LaunchTrack value={null} onCommit={onCommit} />);
    const slider = screen.getByRole("slider", { name: "Rating out of 10" });

    slider.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onCommit).toHaveBeenLastCalledWith(0.5);
    await userEvent.keyboard("{ArrowRight}");
    expect(slider).toHaveAttribute("aria-valuetext", "1 of 10");
    expect(onCommit).toHaveBeenCalledTimes(2);
    expect(onCommit).toHaveBeenLastCalledWith(1);
  });

  it("saves the dragged value when the pointer is released, with no Save button", () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      left: 0, width: 200, top: 0, height: 24, right: 200, bottom: 24, x: 0, y: 0, toJSON: () => ({}),
    });
    // jsdom has no pointer capture.
    HTMLElement.prototype.setPointerCapture = () => {};
    HTMLElement.prototype.releasePointerCapture = () => {};
    const onCommit = vi.fn();
    render(<LaunchTrack value={null} onCommit={onCommit} />);
    const slider = screen.getByRole("slider", { name: "Rating out of 10" });

    fireEvent.pointerDown(slider, { clientX: 100, pointerId: 1 });
    fireEvent.pointerMove(slider, { clientX: 160, pointerId: 1 });
    expect(onCommit).not.toHaveBeenCalled();
    fireEvent.pointerUp(slider, { clientX: 160, pointerId: 1 });

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(8);
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
  });

  it("clears when the current score is tapped again, but not when a drag ends back on it", () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      left: 0, width: 200, top: 0, height: 24, right: 200, bottom: 24, x: 0, y: 0, toJSON: () => ({}),
    });
    HTMLElement.prototype.setPointerCapture = () => {};
    HTMLElement.prototype.releasePointerCapture = () => {};
    const onCommit = vi.fn();
    render(<LaunchTrack value={8} onCommit={onCommit} />);
    const slider = screen.getByRole("slider", { name: "Rating out of 10" });

    fireEvent.pointerDown(slider, { clientX: 160, pointerId: 1 });
    fireEvent.pointerMove(slider, { clientX: 100, pointerId: 1 });
    fireEvent.pointerMove(slider, { clientX: 160, pointerId: 1 });
    fireEvent.pointerUp(slider, { clientX: 160, pointerId: 1 });
    expect(onCommit).not.toHaveBeenCalled();

    fireEvent.pointerDown(slider, { clientX: 160, pointerId: 1 });
    fireEvent.pointerUp(slider, { clientX: 160, pointerId: 1 });
    expect(onCommit).toHaveBeenCalledWith(null);
  });

  it("clears with Delete", async () => {
    const onCommit = vi.fn();
    render(<LaunchTrack value={7.5} onCommit={onCommit} />);

    screen.getByRole("slider", { name: "Rating out of 10" }).focus();
    await userEvent.keyboard("{Delete}");
    expect(onCommit).toHaveBeenCalledWith(null);
  });
});

describe("RocketDisplay", () => {
  it("reads the score out of 10", () => {
    render(<RocketDisplay rating={8} />);
    expect(screen.getByRole("img", { name: "8 of 10" })).toBeInTheDocument();
  });

  it("shows a compact score with one decimal", () => {
    render(<RocketDisplay rating={7.5} variant="compact" />);
    expect(screen.getByText("7.5")).toBeInTheDocument();
  });
});
