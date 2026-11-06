import { fetchTMDB } from "./base-client";
import { createCachedTmdbFetcher } from "./tmdb-cache.helper";
import {
  TMDBPersonCombinedCreditsSchema,
  TMDBPersonDetailSchema,
  TMDBPersonExternalIdsSchema,
  TMDBPersonImagesSchema,
} from "./dto/people-response.dto";
import type {
  TMDBPersonCombinedCredits,
  TMDBPersonDetail,
  TMDBPersonExternalIds,
  TMDBPersonImages,
} from "./dto/people-response.dto";

export type {
  TMDBPersonCombinedCredits,
  TMDBPersonDetail,
  TMDBPersonExternalIds,
  TMDBPersonImages,
} from "./dto/people-response.dto";

// Credit lists for prolific people are large; keep this cache smaller than the default.
const PERSON_CACHE_OPTIONS = { maxEntries: 200 };

export const getPersonDetails = createCachedTmdbFetcher(
  async (tmdbPersonId: number): Promise<TMDBPersonDetail> => {
    const data = await fetchTMDB(`/person/${tmdbPersonId}?language=en-US`);
    return TMDBPersonDetailSchema.parse(data);
  },
  PERSON_CACHE_OPTIONS,
);

export const getPersonCombinedCredits = createCachedTmdbFetcher(
  async (tmdbPersonId: number): Promise<TMDBPersonCombinedCredits> => {
    const data = await fetchTMDB(`/person/${tmdbPersonId}/combined_credits?language=en-US`);
    return TMDBPersonCombinedCreditsSchema.parse(data);
  },
  PERSON_CACHE_OPTIONS,
);

export const getPersonExternalIds = createCachedTmdbFetcher(
  async (tmdbPersonId: number): Promise<TMDBPersonExternalIds> => {
    const data = await fetchTMDB(`/person/${tmdbPersonId}/external_ids`);
    return TMDBPersonExternalIdsSchema.parse(data);
  },
  PERSON_CACHE_OPTIONS,
);

export const getPersonImages = createCachedTmdbFetcher(
  async (tmdbPersonId: number): Promise<TMDBPersonImages> => {
    const data = await fetchTMDB(`/person/${tmdbPersonId}/images`);
    return TMDBPersonImagesSchema.parse(data);
  },
  PERSON_CACHE_OPTIONS,
);
