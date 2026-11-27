import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildStory } from "../../../../../src/features/year-review/story/build-story";
import { StorySlideRenderer } from "../../../../../src/features/year-review/story/story-slide-renderer";
import type { StoryActions, StorySlide } from "../../../../../src/features/year-review/story/story.types";
import { renderWithProviders } from "../../../../support/render/render-with-providers";
import { emptyYear, fullYear } from "../year-review-fixtures";

const actions: StoryActions = {
  begin: vi.fn(),
  next: vi.fn(),
  previous: vi.fn(),
  togglePause: vi.fn(),
  share: vi.fn(),
  replay: vi.fn(),
  isPaused: false,
  reducedMotion: true,
};

const find = (slides: StorySlide[], kind: StorySlide["kind"]) =>
  slides.find((slide) => slide.kind === kind);

const renderSlide = async (
  slide: StorySlide | undefined,
  { isOwner = true, isLoggedIn = true }: { isOwner?: boolean; isLoggedIn?: boolean } = {},
) => {
  expect(slide).toBeDefined();
  const result = renderWithProviders(
    <div data-testid="slide-root">
      <StorySlideRenderer
        slide={slide!}
        actions={actions}
        username="glory42"
        year={2025}
        isOwner={isOwner}
        isLoggedIn={isLoggedIn}
      />
    </div>,
  );
  await screen.findByTestId("slide-root");
  return result;
};

describe("recap closing slides", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the rating comparison and the rewatch", async () => {
    const slides = buildStory(fullYear());
    await renderSlide(find(slides, "taste"));

    expect(screen.getByRole("heading", { name: "You're a soft touch." })).toBeTruthy();
    expect(screen.getByText("7.8")).toBeTruthy();
    expect(screen.getByText("7.1")).toBeTruthy();
    expect(screen.getByText("2 titles got a 9 or better.")).toBeTruthy();
    expect(screen.getByText("Comfort Film")).toBeTruthy();
    expect(screen.getByText("×4")).toBeTruthy();
  });

  it("renders the review quote and the words stats", async () => {
    const slides = buildStory(fullYear());
    await renderSlide(find(slides, "words"));

    expect(screen.getByRole("heading", { name: "You wrote 31 reviews." })).toBeTruthy();
    expect(screen.getByText("“Every frame earns its place.”")).toBeTruthy();
    expect(screen.getByText("12 likes · on Perfect Film")).toBeTruthy();
    expect(screen.getByText("Read the review →")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText("9")).toBeTruthy();
  });

  it("renders the persona and shares the card", async () => {
    const slides = buildStory(fullYear());
    await renderSlide(find(slides, "persona"));

    expect(screen.getByRole("heading", { name: "The Time Traveller" })).toBeTruthy();
    expect(screen.getByText("You spent the year in the past. It looked better there.")).toBeTruthy();
    expect(screen.getByText("1990s")).toBeTruthy();
    expect(screen.getByText("Rewatcher")).toBeTruthy();
    expect(screen.getByText("Based on 142 films · 18 series · 210 episodes")).toBeTruthy();
    expect(screen.getByText("@glory42 · 2025")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Share this card" }));
    expect(actions.share).toHaveBeenCalledTimes(1);
  });

  it("renders the end credits and the owner actions", async () => {
    const slides = buildStory(fullYear());
    await renderSlide(find(slides, "end"));

    expect(screen.getByRole("heading", { name: "That's a wrap." })).toBeTruthy();
    expect(screen.getByText("142")).toBeTruthy();
    expect(screen.getByText("18")).toBeTruthy();
    expect(screen.getByText("210")).toBeTruthy();
    expect(screen.getByText("351")).toBeTruthy();
    expect(screen.getByText("142/100 F")).toBeTruthy();
    expect(screen.getByText("See you in 2026.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Full breakdown" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Log a film" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Share your year" }));
    expect(actions.share).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Replay" }));
    expect(actions.replay).toHaveBeenCalledTimes(1);
  });

  it("gives guests a start CTA instead of the owner actions", async () => {
    const slides = buildStory(fullYear());
    await renderSlide(find(slides, "end"), { isOwner: false, isLoggedIn: false });

    expect(screen.getByRole("link", { name: "Start your journal" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Full breakdown" })).toBeNull();
  });

  it("gives signed-in visitors a way back to the profile", async () => {
    const slides = buildStory(fullYear());
    await renderSlide(find(slides, "end"), { isOwner: false, isLoggedIn: true });
    expect(screen.getByRole("link", { name: "Back to profile" })).toBeTruthy();
  });

  it("renders the quiet-year card for the owner and a guest", async () => {
    const slides = buildStory(emptyYear());
    await renderSlide(find(slides, "empty"));
    expect(screen.getByRole("heading", { name: "A quiet year." })).toBeTruthy();
    expect(screen.getByText("Nothing logged in 2025. The screen is still dark.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Log a film" })).toBeTruthy();

    cleanup();
    await renderSlide(find(slides, "empty"), { isOwner: false, isLoggedIn: false });
    expect(screen.getByRole("link", { name: "Start your journal" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "See the stats" })).toBeTruthy();
  });
});
