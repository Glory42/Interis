import type {
  PersonCreditItem,
  PersonCreditMedia,
  PersonCreditOrder,
  PersonCreditType,
  PersonDetailResponse,
} from "../types/people.types";

export type NormalizedPersonCredits = Record<PersonCreditType, PersonCreditItem[]>;

const matchesMedia = (credit: PersonCreditItem, media: PersonCreditMedia): boolean =>
  media === "combined" || (media === "movies" ? credit.mediaType === "movie" : credit.mediaType === "tv");

const compareByPopularity = (left: PersonCreditItem, right: PersonCreditItem): number =>
  (right.voteCount ?? 0) - (left.voteCount ?? 0) || right.tmdbId - left.tmdbId;

// Earliest release first; undated titles stay last, as they do newest first.
const compareByOldest = (left: PersonCreditItem, right: PersonCreditItem): number => {
  if (!left.releaseDate || !right.releaseDate) {
    return Number(!left.releaseDate) - Number(!right.releaseDate) || compareByPopularity(left, right);
  }
  return Date.parse(left.releaseDate) - Date.parse(right.releaseDate) || compareByPopularity(left, right);
};

export const countPersonCredits = (
  credits: NormalizedPersonCredits,
): PersonDetailResponse["credits"]["counts"] => {
  const countFor = (media: PersonCreditMedia) => ({
    cast: credits.cast.filter((credit) => matchesMedia(credit, media)).length,
    crew: credits.crew.filter((credit) => matchesMedia(credit, media)).length,
  });

  return { combined: countFor("combined"), movies: countFor("movies"), tv: countFor("tv") };
};

export const countPersonJobs = (crew: PersonCreditItem[]): { job: string; count: number }[] => {
  const counts = new Map<string, number>();
  for (const credit of crew) {
    for (const job of credit.jobs) {
      counts.set(job, (counts.get(job) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([job, count]) => ({ job, count }))
    .sort((left, right) => right.count - left.count || left.job.localeCompare(right.job));
};

// Credits arrive sorted newest first; "oldest" and "popular" re-sort a copy.
export const selectPersonCredits = (
  credits: NormalizedPersonCredits,
  query: {
    media: PersonCreditMedia;
    type: PersonCreditType;
    job?: string;
    order: PersonCreditOrder;
  },
): PersonCreditItem[] => {
  const selected = credits[query.type].filter(
    (credit) =>
      matchesMedia(credit, query.media) && (!query.job || credit.jobs.includes(query.job)),
  );

  if (query.order === "popular") return [...selected].sort(compareByPopularity);
  if (query.order === "oldest") return [...selected].sort(compareByOldest);
  return selected;
};

const KNOWN_FOR_LIMIT = 8;

// One row per title across cast and crew, most-voted first.
export const selectKnownFor = (credits: NormalizedPersonCredits): PersonCreditItem[] => {
  const byTitle = new Map<string, PersonCreditItem>();
  for (const credit of [...credits.cast, ...credits.crew]) {
    const key = `${credit.mediaType}:${credit.tmdbId}`;
    if (!byTitle.has(key)) byTitle.set(key, credit);
  }

  return [...byTitle.values()].sort(compareByPopularity).slice(0, KNOWN_FOR_LIMIT);
};

// TMDB biographies often end with a Wikipedia attribution line; it's shown separately.
const BIOGRAPHY_SOURCE_PATTERN =
  /\s*((?:Description above from the Wikipedia article|From Wikipedia, the free encyclopedia)[^\n]*)\s*$/i;

export const splitBiographySource = (
  biography: string | null,
): { biography: string | null; biographySource: string | null } => {
  if (!biography) return { biography, biographySource: null };

  const match = BIOGRAPHY_SOURCE_PATTERN.exec(biography);
  if (!match) return { biography, biographySource: null };

  const text = biography.slice(0, match.index).trim();
  return { biography: text.length > 0 ? text : null, biographySource: match[1]!.trim() };
};
