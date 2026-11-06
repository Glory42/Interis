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

// Credits arrive sorted newest first; "popular" re-sorts by TMDB vote count.
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

  return query.order === "popular" ? [...selected].sort(compareByPopularity) : selected;
};
