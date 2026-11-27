import { describe, expect, it } from "vitest";
import type { YearReview } from "../../../../../src/features/year-review/api";
import { buildStory } from "../../../../../src/features/year-review/story/build-story";
import type { StorySlide } from "../../../../../src/features/year-review/story/story.types";
import { emptyYear, fullYear, thinYear } from "../year-review-fixtures";

const ids = (slides: StorySlide[]) => slides.map((slide) => slide.id);
const find = (slides: StorySlide[], id: StorySlide["id"]) => slides.find((slide) => slide.id === id);

const thin = (overrides: Partial<YearReview> = {}) =>
  thinYear({ topSeries: [], topSeriesSpotlight: null, ...overrides });

describe("buildStory", () => {
  it("orders a full year as the 13-card deck", () => {
    const slides = buildStory(fullYear());

    expect(ids(slides)).toEqual([
      "cover",
      "volume",
      "top-films",
      "spotlight",
      "top-series",
      "genre",
      "director",
      "time-machine",
      "rhythm",
      "taste",
      "words",
      "persona",
      "end",
    ]);
    expect(new Set(ids(slides)).size).toBe(slides.length);
  });

  it("passes the story data through the slides", () => {
    const review = fullYear();
    const slides = buildStory(review);

    expect(find(slides, "cover")).toMatchObject({
      depth: "full",
      year: 2025,
      isPartialYear: false,
      user: review.user,
    });
    expect(find(slides, "volume")).toMatchObject({
      totals: review.totals,
      previousYear: review.previousYear,
      isPartialYear: false,
    });
    expect(find(slides, "top-films")).toMatchObject({ scope: "films", titles: review.topFilms });
    expect(find(slides, "spotlight")).toMatchObject({ title: review.topFilm });
    expect(find(slides, "top-series")).toMatchObject({ scope: "series", titles: review.topSeries });

    const genre = find(slides, "genre");
    expect(genre).toMatchObject({ totalTitles: 160 });
    if (genre?.kind === "genre") {
      expect(genre.genres[0]).toEqual({ genre: "Drama", count: 40, share: 0.25 });
    }

    const director = find(slides, "director");
    if (director?.kind === "director") {
      expect(director.director.director).toBe("Ada Lens");
      expect(director.titles).toHaveLength(2);
    }

    const time = find(slides, "time-machine");
    if (time?.kind === "time-machine") {
      expect(time.viewingAge).toBe(1999);
      expect(time.pre1980Share).toBe(0.1);
      expect(time.decades).toHaveLength(2);
    }

    const rhythm = find(slides, "rhythm");
    if (rhythm?.kind === "rhythm") {
      expect(rhythm.busiestDay).toEqual({ day: "2025-03-10", count: 2 });
      expect(rhythm.longestStreak?.days).toBe(6);
    }

    const taste = find(slides, "taste");
    if (taste?.kind === "taste") {
      expect(taste.average).toBe(7.8);
      expect(taste.communityAverage).toBe(7.1);
      expect(taste.mostRewatched?.title).toBe("Comfort Film");
    }

    const words = find(slides, "words");
    if (words?.kind === "words") {
      expect(words.count).toBe(31);
      expect(words.mostLiked?.excerpt).toBe("Every frame earns its place.");
    }

    expect(find(slides, "persona")).toMatchObject({ persona: review.persona });
    expect(find(slides, "end")).toMatchObject({ totals: review.totals, goal: review.goal });
  });

  it("drops the series card in a films-only year", () => {
    const slides = buildStory(fullYear({ topSeries: [], topSeriesSpotlight: null }));
    expect(ids(slides)).not.toContain("top-series");
    expect(ids(slides)).toContain("top-films");
    expect(ids(slides)).toContain("spotlight");
  });

  it("drops film-only cards in a series-only year", () => {
    const slides = buildStory(
      fullYear({ topFilms: [], topFilm: null, topDirectors: [], directorTitles: [] }),
    );
    expect(ids(slides)).not.toContain("top-films");
    expect(ids(slides)).not.toContain("spotlight");
    expect(ids(slides)).not.toContain("director");
    expect(ids(slides)).toContain("top-series");
  });

  it("drops cards whose data is missing", () => {
    const noRatings = buildStory(
      fullYear({
        ratings: { average: null, ratedLogs: 0, communityAverage: null },
        highRatings: 0,
        mostRewatched: null,
      }),
    );
    expect(ids(noRatings)).not.toContain("taste");

    const noDirector = buildStory(fullYear({ topDirectors: [], directorTitles: [] }));
    expect(ids(noDirector)).not.toContain("director");

    const noTimeMachine = buildStory(fullYear({ viewingAge: null, pre1980Share: null }));
    expect(ids(noTimeMachine)).not.toContain("time-machine");

    const noReviews = buildStory(
      fullYear({ reviews: { count: 0, mostLiked: null }, listsCreated: 0, newFollowers: 0 }),
    );
    expect(ids(noReviews)).not.toContain("words");

    const noPersona = buildStory(fullYear({ persona: null }));
    expect(ids(noPersona)).not.toContain("persona");
  });

  it("keeps the taste card for a rewatch-only year", () => {
    const slides = buildStory(
      fullYear({
        ratings: { average: null, ratedLogs: 0, communityAverage: null },
        mostRewatched: fullYear().mostRewatched,
      }),
    );
    expect(ids(slides)).toContain("taste");
  });

  it("gives a thin year five cards, using the persona as its one highlight", () => {
    const slides = buildStory(thin({ persona: fullYear().persona }));
    expect(ids(slides)).toEqual(["cover", "volume", "titles", "persona", "end"]);
    expect(find(slides, "titles")).toMatchObject({ scope: "mixed" });
  });

  it("falls back to the strongest available highlight in a thin year", () => {
    const slides = buildStory(thin());
    expect(ids(slides)).toEqual(["cover", "volume", "titles", "time-machine", "end"]);
  });

  it("does not invent a highlight when a thin year has none", () => {
    const slides = buildStory(
      thin({
        topFilms: [],
        topSeries: [],
        persona: null,
        viewingAge: null,
        pre1980Share: null,
        topDirectors: [],
        directorTitles: [],
        topGenres: [],
        logsPerDay: [],
        ratings: { average: null, ratedLogs: 0, communityAverage: null },
        mostRewatched: null,
        reviews: { count: 0, mostLiked: null },
        listsCreated: 0,
        newFollowers: 0,
      }),
    );
    expect(ids(slides)).toEqual(["cover", "volume", "end"]);
  });

  it("returns one quiet card for an empty year", () => {
    const review = emptyYear();
    const slides = buildStory(review);
    expect(ids(slides)).toEqual(["empty"]);
    expect(slides[0]).toMatchObject({
      kind: "empty",
      year: 2025,
      isPartialYear: false,
      user: review.user,
    });
  });

  it("marks the current year as so far on the cover, volume and end cards", () => {
    const slides = buildStory(fullYear({ isPartialYear: true }));
    expect(find(slides, "cover")).toMatchObject({ isPartialYear: true });
    expect(find(slides, "volume")).toMatchObject({ isPartialYear: true });
    expect(find(slides, "end")).toMatchObject({ isPartialYear: true });
  });

  it("is deterministic for the same review", () => {
    const review = fullYear();
    expect(buildStory(review)).toEqual(buildStory(review));
  });
});
