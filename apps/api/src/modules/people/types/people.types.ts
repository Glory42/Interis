export const personRouteRoleValues = ["actor", "director"] as const;

export type PersonRouteRole = (typeof personRouteRoleValues)[number];

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
  mediaType: "movie" | "tv";
  tmdbId: number;
  title: string;
  originalTitle: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string | null;
  releaseYear: number | null;
  character: string | null;
  job: string | null;
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
  credits: {
    combined: {
      cast: PersonCreditItem[];
      crew: PersonCreditItem[];
    };
    movies: {
      cast: PersonCreditItem[];
      crew: PersonCreditItem[];
    };
    tv: {
      cast: PersonCreditItem[];
      crew: PersonCreditItem[];
    };
  };
};
