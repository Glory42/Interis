import type {
  YearReviewDepth,
  YearReviewPersona,
  YearReviewPersonaId,
} from "../types/year-review.types";

// Everything the persona needs from the assembled year. Kept separate from
// YearReview so the helper stays pure and easy to test.
export type PersonaInput = {
  depth: YearReviewDepth;
  logs: number;
  filmLogs: number;
  seriesLogs: number;
  films: number;
  series: number;
  episodes: number;
  hoursWatched: number;
  rewatchLogs: number;
  mostRewatchedLogCount: number;
  averageRating: number | null;
  communityAverage: number | null;
  ratedLogs: number;
  highRatings: number;
  topGenres: { genre: string; count: number }[];
  topDirectors: { director: string; count: number }[];
  decades: { decade: number; count: number }[];
  reviewCount: number;
  listsCreated: number;
  longestStreakDays: number;
  busiestDayCount: number;
  viewingAge: number | null;
  pre1980Share: number | null;
  distinctGenres: number;
  distinctDirectors: number;
};

type PersonaDefinition = {
  name: string;
  tagline: string;
};

const PERSONA_DEFINITIONS: Record<YearReviewPersonaId, PersonaDefinition> = {
  "time-traveller": {
    name: "The Time Traveller",
    tagline: "You spent the year in the past. It looked better there.",
  },
  completionist: {
    name: "The Completionist",
    tagline: "One more episode. You said that more than once.",
  },
  rewatcher: {
    name: "The Rewatcher",
    tagline: "You know what you like. You went back to check.",
  },
  marathoner: {
    name: "The Marathoner",
    tagline: "Sleep is a post-credits scene.",
  },
  curator: {
    name: "The Curator",
    tagline: "You don't just watch. You arrange.",
  },
  critic: {
    name: "The Critic",
    tagline: "You have notes. You wrote them down.",
  },
  romantic: {
    name: "The Romantic",
    tagline: "You lead with your heart.",
  },
  explorer: {
    name: "The Explorer",
    tagline: "No two nights the same.",
  },
  devotee: {
    name: "The Devotee",
    tagline: "A steady year at the movies.",
  },
};

// Earlier entries win ties within 0.05.
const PERSONA_ORDER: YearReviewPersonaId[] = [
  "time-traveller",
  "completionist",
  "rewatcher",
  "marathoner",
  "curator",
  "critic",
  "romantic",
  "explorer",
  "devotee",
];

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const ratio = (part: number, whole: number) => (whole > 0 ? part / whole : 0);
const percent = (share: number) => `${Math.round(share * 100)}%`;

const scoreFor = (input: PersonaInput): Record<YearReviewPersonaId, number> => {
  const totalTitles = input.films + input.series;
  const seriesShare = ratio(input.seriesLogs, input.logs);
  const rewatchShare = ratio(input.rewatchLogs, input.logs);
  const reviewsPerLog = ratio(input.reviewCount, input.logs);
  const topGenreShare = ratio(input.topGenres[0]?.count ?? 0, totalTitles);
  const ratingDelta =
    input.averageRating !== null && input.communityAverage !== null
      ? input.averageRating - input.communityAverage
      : null;
  const highRatingShare = ratio(input.highRatings, input.ratedLogs);

  const timeTraveller =
    input.viewingAge === null || input.pre1980Share === null
      ? 0
      : 0.7 * clamp01(input.pre1980Share / 0.4) +
        0.3 * clamp01((1990 - input.viewingAge) / 40);

  return {
    "time-traveller": timeTraveller,
    completionist:
      0.5 * seriesShare +
      0.3 * clamp01(input.episodes / 600) +
      0.2 * clamp01(input.series / 20),
    rewatcher:
      0.7 * clamp01(rewatchShare / 0.25) +
      0.3 * clamp01(input.mostRewatchedLogCount / 4),
    marathoner:
      0.4 * clamp01(input.logs / 150) +
      0.3 * clamp01(input.hoursWatched / 400) +
      0.2 * clamp01(input.longestStreakDays / 21) +
      0.1 * clamp01(input.busiestDayCount / 4),
    curator:
      0.5 * clamp01(input.reviewCount / 15) +
      0.3 * clamp01(input.listsCreated / 4) +
      0.2 * clamp01(reviewsPerLog / 0.3),
    critic:
      ratingDelta !== null && ratingDelta < -0.3
        ? 0.6 * clamp01(-ratingDelta / 1.5) +
          0.3 * clamp01(input.reviewCount / 10) +
          0.1 * clamp01(input.ratedLogs / 30)
        : 0,
    romantic:
      input.averageRating !== null && input.averageRating >= 7.5
        ? 0.5 * clamp01((ratingDelta ?? 0) / 1) +
          0.4 * clamp01((input.averageRating - 7.5) / 2) +
          0.1 * clamp01(highRatingShare / 0.5)
        : 0,
    explorer:
      0.5 * clamp01(input.distinctGenres / 10) +
      0.3 * clamp01(input.distinctDirectors / 25) +
      0.2 * (1 - topGenreShare),
    devotee: 0.45,
  };
};

const describe = (id: YearReviewPersonaId, input: PersonaInput): string => {
  switch (id) {
    case "time-traveller":
      return `Your median watch was released in ${input.viewingAge}. ${percent(
        input.pre1980Share ?? 0,
      )} of what you watched was made before 1980.`;
    case "completionist":
      return `${input.series} series, ${input.episodes.toLocaleString(
        "en-US",
      )} episodes. You do not leave a story half-told.`;
    case "rewatcher":
      return `${percent(ratio(input.rewatchLogs, input.logs))} of your logs were rewatches. Comfort is a valid genre.`;
    case "marathoner":
      return `${input.logs.toLocaleString("en-US")} logs, ${input.hoursWatched.toLocaleString(
        "en-US",
      )} hours, a ${input.longestStreakDays}-day streak. The credits rolled and you pressed play again.`;
    case "curator":
      return `${input.reviewCount} ${input.reviewCount === 1 ? "review" : "reviews"}, ${
        input.listsCreated
      } ${input.listsCreated === 1 ? "list" : "lists"}. You turn a year of watching into something other people can read.`;
    case "critic": {
      const delta = Math.abs((input.averageRating ?? 0) - (input.communityAverage ?? 0));
      return `You rated ${delta.toFixed(1)} below the room. You have notes, and you wrote them down.`;
    }
    case "romantic":
      return input.averageRating !== null && input.communityAverage !== null
        ? `You averaged ${input.averageRating.toFixed(
            1,
          )} while the community averaged ${input.communityAverage.toFixed(
            1,
          )}. You lead with your heart.`
        : "You lead with your heart.";
    case "explorer":
      return `${input.distinctGenres} genres, ${input.distinctDirectors} directors. You kept changing the channel.`;
    case "devotee":
      return `${input.logs.toLocaleString("en-US")} logs, ${input.hoursWatched.toLocaleString(
        "en-US",
      )} hours, and a seat that knew your name.`;
  }
};

const traitsFor = (
  input: PersonaInput,
  winnerId: YearReviewPersonaId,
  ranked: { id: YearReviewPersonaId; score: number }[],
): string[] => {
  const traits: string[] = [];
  const topDecade = [...input.decades].sort(
    (a, b) => b.count - a.count || b.decade - a.decade,
  )[0];
  if (topDecade) traits.push(`${topDecade.decade}s`);

  const topGenre = input.topGenres[0]?.genre;
  if (topGenre) traits.push(topGenre);

  const secondary = ranked.find((entry) => entry.id !== winnerId && entry.score >= 0.35);
  if (secondary) traits.push(PERSONA_DEFINITIONS[secondary.id].name.replace(/^The /, ""));

  if (input.averageRating !== null && input.ratedLogs > 0) {
    traits.push(`${input.averageRating.toFixed(1)} avg`);
  }
  return traits.slice(0, 4);
};

// Null for an empty year and for a thin year without a strong enough signal.
export const resolvePersona = (input: PersonaInput): YearReviewPersona | null => {
  if (input.depth === "empty" || input.logs === 0) return null;

  const scores = scoreFor(input);
  const ranked = PERSONA_ORDER.map((id) => ({ id, score: scores[id] })).sort(
    (a, b) => b.score - a.score || PERSONA_ORDER.indexOf(a.id) - PERSONA_ORDER.indexOf(b.id),
  );
  const winner = ranked[0]!;

  // A thin year needs a clear signal; the Devotee floor is not enough.
  if (input.depth === "thin" && (input.logs < 5 || winner.score < 0.6)) return null;

  const definition = PERSONA_DEFINITIONS[winner.id];
  return {
    id: winner.id,
    name: definition.name,
    tagline: definition.tagline,
    description: describe(winner.id, input),
    traits: traitsFor(input, winner.id, ranked),
    score: Math.round(winner.score * 1000) / 1000,
  };
};
