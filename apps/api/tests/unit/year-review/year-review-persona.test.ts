import { describe, expect, it } from "bun:test";
import {
  resolvePersona,
  type PersonaInput,
} from "../../../src/modules/year-review/helpers/year-review-persona.helper";

const fullYear = (overrides: Partial<PersonaInput> = {}): PersonaInput => ({
  depth: "full",
  logs: 60,
  filmLogs: 50,
  seriesLogs: 10,
  films: 45,
  series: 8,
  episodes: 40,
  hoursWatched: 120,
  rewatchLogs: 3,
  mostRewatchedLogCount: 1,
  averageRating: 7.5,
  communityAverage: 7.0,
  ratedLogs: 40,
  highRatings: 4,
  topGenres: [{ genre: "Drama", count: 12 }],
  topDirectors: [{ director: "Someone", count: 2 }],
  decades: [
    { decade: 2010, count: 30 },
    { decade: 2020, count: 15 },
  ],
  reviewCount: 2,
  listsCreated: 0,
  longestStreakDays: 5,
  busiestDayCount: 2,
  viewingAge: 2015,
  pre1980Share: 0.05,
  distinctGenres: 4,
  distinctDirectors: 8,
  ...overrides,
});

// A deliberately low-signal year: the Devotee should win, not an accident of one metric.
const quietYear = (overrides: Partial<PersonaInput> = {}) =>
  fullYear({
    logs: 20,
    filmLogs: 17,
    seriesLogs: 3,
    films: 15,
    series: 3,
    episodes: 10,
    hoursWatched: 40,
    rewatchLogs: 0,
    mostRewatchedLogCount: 0,
    averageRating: 7.0,
    communityAverage: 7.0,
    ratedLogs: 10,
    highRatings: 0,
    topGenres: [{ genre: "Drama", count: 8 }],
    decades: [{ decade: 2010, count: 10 }],
    reviewCount: 0,
    listsCreated: 0,
    longestStreakDays: 2,
    busiestDayCount: 1,
    viewingAge: 2012,
    pre1980Share: 0.02,
    distinctGenres: 2,
    distinctDirectors: 3,
    ...overrides,
  });

const timeTravellerYear = (overrides: Partial<PersonaInput> = {}) =>
  fullYear({
    viewingAge: 1974,
    pre1980Share: 0.43,
    decades: [
      { decade: 1970, count: 40 },
      { decade: 2010, count: 20 },
    ],
    rewatchLogs: 20,
    topGenres: [{ genre: "Drama", count: 20 }],
    ...overrides,
  });

describe("resolvePersona", () => {
  it("returns The Time Traveller for an old-cinema year and shows the receipts", () => {
    const persona = resolvePersona(timeTravellerYear());
    expect(persona).not.toBeNull();
    expect(persona?.id).toBe("time-traveller");
    expect(persona?.name).toBe("The Time Traveller");
    expect(persona?.tagline).toBe("You spent the year in the past. It looked better there.");
    expect(persona?.description).toContain("1974");
    expect(persona?.description).toContain("43%");
    expect(persona?.traits).toEqual(["1970s", "Drama", "Rewatcher", "7.5 avg"]);
    expect(persona?.score).toBeGreaterThan(0.8);
  });

  it("returns The Completionist for a series-heavy year", () => {
    const persona = resolvePersona(
      fullYear({
        logs: 100,
        filmLogs: 20,
        seriesLogs: 80,
        films: 10,
        series: 25,
        episodes: 700,
      }),
    );
    expect(persona?.id).toBe("completionist");
    expect(persona?.description).toContain("700 episodes");
  });

  it("returns The Rewatcher when a large share of the year was rewatches", () => {
    const persona = resolvePersona(
      fullYear({ logs: 100, filmLogs: 90, seriesLogs: 10, rewatchLogs: 30, mostRewatchedLogCount: 4 }),
    );
    expect(persona?.id).toBe("rewatcher");
    expect(persona?.description).toContain("30% of your logs were rewatches");
  });

  it("returns The Marathoner for volume, hours, streaks and big days", () => {
    const persona = resolvePersona(
      fullYear({
        logs: 200,
        filmLogs: 180,
        seriesLogs: 20,
        hoursWatched: 500,
        longestStreakDays: 30,
        busiestDayCount: 5,
      }),
    );
    expect(persona?.id).toBe("marathoner");
    expect(persona?.description).toContain("200 logs");
  });

  it("returns The Curator for reviews and lists", () => {
    const persona = resolvePersona(fullYear({ reviewCount: 20, listsCreated: 5, logs: 100 }));
    expect(persona?.id).toBe("curator");
    expect(persona?.description).toContain("20 reviews, 5 lists");
  });

  it("returns The Critic when the year is rated below the room", () => {
    const persona = resolvePersona(
      fullYear({ reviewCount: 12, averageRating: 5.8, communityAverage: 7.2, ratedLogs: 30 }),
    );
    expect(persona?.id).toBe("critic");
    expect(persona?.description).toContain("1.4 below the room");
  });

  it("returns The Romantic when the year is rated high", () => {
    const persona = resolvePersona(
      fullYear({ averageRating: 9.0, communityAverage: 7.0, ratedLogs: 30, highRatings: 20 }),
    );
    expect(persona?.id).toBe("romantic");
    expect(persona?.description).toContain("9.0 while the community averaged 7.0");
  });

  it("returns The Explorer for a wide spread of genres and directors", () => {
    const persona = resolvePersona(
      fullYear({
        distinctGenres: 12,
        distinctDirectors: 30,
        topGenres: [{ genre: "Drama", count: 2 }],
        films: 50,
        series: 5,
      }),
    );
    expect(persona?.id).toBe("explorer");
    expect(persona?.description).toContain("12 genres, 30 directors");
  });

  it("falls back to The Devotee when nothing stands out", () => {
    const persona = resolvePersona(quietYear());
    expect(persona?.id).toBe("devotee");
    expect(persona?.score).toBe(0.45);
  });

  it("keeps a strong thin-year signal but drops a weak one", () => {
    const strong = resolvePersona(
      timeTravellerYear({
        depth: "thin",
        logs: 6,
        filmLogs: 6,
        seriesLogs: 0,
        films: 6,
        series: 0,
        decades: [{ decade: 1970, count: 6 }],
      }),
    );
    expect(strong?.id).toBe("time-traveller");

    const weak = resolvePersona(
      quietYear({ depth: "thin", logs: 6, filmLogs: 6, seriesLogs: 0, films: 6, series: 0 }),
    );
    expect(weak).toBeNull();
  });

  it("returns null for empty years and thin years below five logs", () => {
    expect(resolvePersona(fullYear({ depth: "empty", logs: 0 }))).toBeNull();
    expect(resolvePersona(timeTravellerYear({ depth: "thin", logs: 4 }))).toBeNull();
  });

  it("is deterministic for the same input", () => {
    const input = timeTravellerYear();
    expect(resolvePersona(input)).toEqual(resolvePersona(input));
  });
});
