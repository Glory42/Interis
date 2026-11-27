import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildStory } from "../../../../../src/features/year-review/story/build-story";
import { StorySlideRenderer } from "../../../../../src/features/year-review/story/story-slide-renderer";
import type { StoryActions, StorySlide } from "../../../../../src/features/year-review/story/story.types";
import { renderWithProviders } from "../../../../support/render/render-with-providers";
import { fullYear } from "../year-review-fixtures";

const actions: StoryActions = {
  begin: vi.fn(),
  next: vi.fn(),
  previous: vi.fn(),
  togglePause: vi.fn(),
  isPaused: false,
  reducedMotion: true,
};

const find = (slides: StorySlide[], kind: StorySlide["kind"]) =>
  slides.find((slide) => slide.kind === kind);

const renderSlide = async (slide: StorySlide | undefined) => {
  expect(slide).toBeDefined();
  const result = renderWithProviders(
    <div data-testid="slide-root">
      <StorySlideRenderer slide={slide!} actions={actions} username="glory42" />
    </div>,
  );
  await screen.findByTestId("slide-root");
  return result;
};

describe("recap identity slides", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the genre word and shares", async () => {
    const slides = buildStory(fullYear());
    await renderSlide(find(slides, "genre"));

    expect(screen.getAllByText("Drama").length).toBeGreaterThan(1);
    expect(screen.getByText("25% of everything you watched.")).toBeTruthy();
    expect(screen.getByText("Thriller")).toBeTruthy();
    expect(screen.getByText("14%")).toBeTruthy();
  });

  it("renders the director and their films", async () => {
    const slides = buildStory(fullYear());
    await renderSlide(find(slides, "director"));

    expect(screen.getByRole("heading", { name: "Ada Lens" })).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();
    expect(screen.getByText("films this year")).toBeTruthy();
    expect(screen.getByText("First Lens Film")).toBeTruthy();
    expect(screen.getByText("Second Lens Film")).toBeTruthy();
    expect(screen.getByText("A one-person retrospective.")).toBeTruthy();
  });

  it("renders the viewing age and the decade spread", async () => {
    const slides = buildStory(fullYear());
    await renderSlide(find(slides, "time-machine"));

    expect(screen.getByText("1999")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "You watched like it's 1999." })).toBeTruthy();
    expect(screen.getByText("10% of your year was made before 1980.")).toBeTruthy();
    expect(screen.getByText("90s")).toBeTruthy();
    expect(screen.getByText("20s")).toBeTruthy();
    expect(screen.getByText("10% before 1980")).toBeTruthy();
  });

  it("renders the busiest month, streak and busiest day", async () => {
    const slides = buildStory(fullYear());
    await renderSlide(find(slides, "rhythm"));

    expect(screen.getByRole("heading", { name: "March was your season." })).toBeTruthy();
    expect(screen.getByText("6 days")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("films on Mar 10")).toBeTruthy();
    expect(screen.getByText("Mar 10 – Mar 15")).toBeTruthy();
  });
});
