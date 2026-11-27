import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildStory } from "../../../../../src/features/year-review/story/build-story";
import { StoryPlayer } from "../../../../../src/features/year-review/story/story-player";
import { fullYear } from "../year-review-fixtures";

const slides = buildStory(fullYear());

const renderPlayer = (props: Partial<Parameters<typeof StoryPlayer>[0]> = {}) => {
  const onExit = vi.fn();
  const onSlideChange = vi.fn();
  render(
    <StoryPlayer
      slides={slides}
      year={2025}
      onExit={onExit}
      onSlideChange={onSlideChange}
      renderSlide={(slide) => <div data-testid="slide-content">{slide.id}</div>}
      {...props}
    />,
  );
  return { onExit, onSlideChange };
};

const current = () => screen.getByTestId("slide-content").textContent;

describe("StoryPlayer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("starts on the cover and auto-advances after the first move", () => {
    renderPlayer();
    expect(current()).toBe("cover");

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(current()).toBe("volume");

    act(() => vi.advanceTimersByTime(8100));
    expect(current()).toBe("top-films");
  });

  it("pauses and resumes the clock", () => {
    renderPlayer();
    fireEvent.keyDown(window, { key: "ArrowRight" });

    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    act(() => vi.advanceTimersByTime(9000));
    expect(current()).toBe("volume");

    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    act(() => vi.advanceTimersByTime(8100));
    expect(current()).toBe("top-films");
  });

  it("stays manual when reduced motion is requested", () => {
    renderPlayer({ reducedMotion: true });
    fireEvent.keyDown(window, { key: "ArrowRight" });
    act(() => vi.advanceTimersByTime(9000));
    expect(current()).toBe("volume");
  });

  it("opens the slide named in the deep link", () => {
    renderPlayer({ initialSlideId: "words" });
    expect(current()).toBe("words");
  });

  it("jumps from a progress segment", () => {
    renderPlayer();
    fireEvent.click(screen.getByRole("tab", { name: "Go to card 5: The series" }));
    expect(current()).toBe("top-series");
  });

  it("navigates from the tap zones", () => {
    renderPlayer();
    const deck = screen.getByTestId("story-deck");
    vi.spyOn(deck, "getBoundingClientRect").mockReturnValue({
      left: 0,
      width: 300,
      top: 0,
      height: 600,
      right: 300,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    fireEvent.click(deck, { clientX: 290 });
    expect(current()).toBe("volume");

    fireEvent.click(deck, { clientX: 10 });
    expect(current()).toBe("cover");
  });

  it("supports arrow keys and Escape", () => {
    const { onExit } = renderPlayer();
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(current()).toBe("volume");

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(current()).toBe("cover");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("reports the current slide to the route", () => {
    const { onSlideChange } = renderPlayer();
    expect(onSlideChange).toHaveBeenLastCalledWith(expect.objectContaining({ id: "cover" }));

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(onSlideChange).toHaveBeenLastCalledWith(expect.objectContaining({ id: "volume" }));
  });
});
