import type { MediaType } from "../../media/constants/media-type.constant";

export const personRouteRoleValues = ["actor", "director"] as const;

export type PersonRouteRole = (typeof personRouteRoleValues)[number];

export const personCreditMediaValues = ["combined", "movies", "tv"] as const;
export const personCreditTypeValues = ["cast", "crew"] as const;
export const personCreditOrderValues = ["recent", "oldest", "popular"] as const;

export type PersonCreditMedia = (typeof personCreditMediaValues)[number];
export type PersonCreditType = (typeof personCreditTypeValues)[number];
export type PersonCreditOrder = (typeof personCreditOrderValues)[number];

export type PersonLinkItem = {
  tmdbPersonId: number;
  slug: string;
  name: string;
  profilePath: string | null;
  knownForDepartment: string | null;
  routeRole: PersonRouteRole;
  character: string | null;
  job: string | null;
  department: string | null;
};

export type PersonCreditItem = {
  mediaType: MediaType;
  tmdbId: number;
  title: string;
  originalTitle: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string | null;
  releaseYear: number | null;
  character: string | null;
  jobs: string[];
  department: string | null;
  episodeCount: number | null;
  voteAverage: number | null;
  voteCount: number | null;
};

export type PersonDetailResponse = {
  person: {
    tmdbPersonId: number;
    slug: string;
    name: string;
    knownForDepartment: string | null;
    profilePath: string | null;
    biography: string | null;
    biographySource: string | null;
    birthday: string | null;
    deathday: string | null;
    placeOfBirth: string | null;
    popularity: number | null;
    homepage: string | null;
    alsoKnownAs: string[];
    roleHints: PersonRouteRole[];
    externalIds: {
      imdbId: string | null;
      facebookId: string | null;
      instagramId: string | null;
      twitterId: string | null;
      wikidataId: string | null;
      tiktokId: string | null;
      youtubeId: string | null;
    };
    images: {
      profiles: {
        filePath: string;
        width: number;
        height: number;
        voteAverage: number;
        voteCount: number;
      }[];
    };
    canonicalRoute: {
      requestedRole: PersonRouteRole;
      requestedPath: string;
      actorPath: string;
      directorPath: string;
      isCanonicalSlug: boolean;
    };
  };
  knownFor: PersonCreditItem[];
  credits: {
    counts: Record<PersonCreditMedia, Record<PersonCreditType, number>>;
    jobCounts: { job: string; count: number }[];
  };
};

export type PersonCreditsPage = {
  items: PersonCreditItem[];
  total: number;
};
