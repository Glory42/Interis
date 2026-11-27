import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildStory } from "../../../../../src/features/year-review/story/build-story";
import { StorySlideRenderer } from "../../../../../src/features/year-review/story/story-slide-renderer";
import type { StoryActions, StorySlide } from "../../../../../src/features/year-review/story/story.types";
import { renderWithProviders } from "../../../../support/render/render-with-providers";
import { fullYear, thinYear } from "../year-review-fixtures";

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

const renderSlide = async (slide: StorySlide | undefined) => {
  expect(slide).toBeDefined();
  const result = renderWithProviders(
    <div data-testid="slide-root">
      <StorySlideRenderer
        slide={slide!}
        actions={actions}
        username="glory42"
        year={2025}
        isOwner
        isLoggedIn
      />
    </div>,
  );
  await screen.findByTestId("slide-root");
  return result;
};

describe("recap opening slides", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the cover and begins the story", async () => {
    const slides = buildStory(fullYear());
    await renderSlide(find(slides, "cover"));

    expect(screen.getByRole("heading", { name: "A year in the dark" })).toBeTruthy();
    expect(screen.getByText("A private screening for Glory · 2025")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Begin" }));
    expect(actions.begin).toHaveBeenCalledTimes(1);
  });

  it("renders the cover poster wall from the year's posters", async () => {
    const slides = buildStory(fullYear({ posterPaths: ["/one.jpg", "/two.jpg"] }));
    const result = await renderSlide(find(slides, "cover"));
    expect(result.container.querySelectorAll("img")).toHaveLength(2);
  });

  it("uses the short-film cover for a thin year", async () => {
    const slides = buildStory(thinYear());
    await renderSlide(find(slides, "cover"));
    expect(screen.getByRole("heading", { name: "A short film" })).toBeTruthy();
  });

  it("renders the volume and its comparison", async () => {
    const slides = buildStory(fullYear());
    await renderSlide(find(slides, "volume"));

    expect(screen.getByText("351")).toBeTruthy();
    expect(screen.getByText("14.6 days")).toBeTruthy();
    expect(screen.getByText("142")).toBeTruthy();
    expect(screen.getByText("210")).toBeTruthy();
    expect(screen.getByText("↓ 12% vs 2024")).toBeTruthy();
  });

  it("renders the ranked films and the watched count", async () => {
    const slides = buildStory(fullYear());
    await renderSlide(find(slides, "ranked-titles"));

    expect(screen.getByRole("heading", { name: "The five that stayed." })).toBeTruthy();
    expect(screen.getAllByText("Perfect Film").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Second Film").length).toBeGreaterThan(0);
    expect(screen.getByText("Ranked by your rating · 142 films watched")).toBeTruthy();
  });

  it("uses the series wording for the series card", async () => {
    const slides = buildStory(fullYear());
    const series = slides.filter((slide) => slide.kind === "ranked-titles" && slide.scope === "series");
    await renderSlide(series[0]);

    expect(screen.getByRole("heading", { name: "And the one you binged." })).toBeTruthy();
    expect(screen.getByText("Ranked by your rating · 18 series watched")).toBeTruthy();
  });

  it("renders the spotlight with the review quote", async () => {
    const slides = buildStory(fullYear());
    await renderSlide(find(slides, "spotlight"));

    expect(screen.getAllByText("Perfect Film").length).toBeGreaterThan(0);
    expect(screen.getByText("10.0")).toBeTruthy();
    expect(screen.getByText("“Every frame earns its place.”")).toBeTruthy();
  });

  it("routes a spoiler spotlight to the review instead of leaking it", async () => {
    const review = fullYear();
    const slides = buildStory({
      ...review,
      topFilm: {
        ...review.topFilm!,
        review: {
          id: "11111111-2222-4333-8444-555555555555",
          excerpt: "",
          containsSpoilers: true,
        },
      },
    });
    await renderSlide(find(slides, "spotlight"));

    expect(screen.getByText("Contains spoilers — read it on Interis →")).toBeTruthy();
    expect(screen.queryByText("“Every frame earns its place.”")).toBeNull();
  });
});
