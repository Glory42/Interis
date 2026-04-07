import { fetchTMDB } from "./base-client";
import {
  TMDBPersonCombinedCreditsSchema,
  TMDBPersonDetailSchema,
  TMDBPersonExternalIdsSchema,
  TMDBPersonImagesSchema,
  TMDBPersonMovieCreditsSchema,
  TMDBPersonTvCreditsSchema,
} from "./dto/people-response.dto";
import type {
  TMDBPersonCombinedCredits,
  TMDBPersonDetail,
  TMDBPersonExternalIds,
  TMDBPersonImages,
  TMDBPersonMovieCredits,
  TMDBPersonTvCredits,
} from "./dto/people-response.dto";

export type {
  TMDBPersonCombinedCredits,
  TMDBPersonDetail,
  TMDBPersonExternalIds,
  TMDBPersonImages,
  TMDBPersonMovieCredits,
  TMDBPersonTvCredits,
} from "./dto/people-response.dto";

export const getPersonDetails = async (
  tmdbPersonId: number,
): Promise<TMDBPersonDetail> => {
  const data = await fetchTMDB(`/person/${tmdbPersonId}?language=en-US`);
  return TMDBPersonDetailSchema.parse(data);
};

export const getPersonCombinedCredits = async (
  tmdbPersonId: number,
): Promise<TMDBPersonCombinedCredits> => {
  const data = await fetchTMDB(`/person/${tmdbPersonId}/combined_credits?language=en-US`);
  return TMDBPersonCombinedCreditsSchema.parse(data);
};

export const getPersonMovieCredits = async (
  tmdbPersonId: number,
): Promise<TMDBPersonMovieCredits> => {
  const data = await fetchTMDB(`/person/${tmdbPersonId}/movie_credits?language=en-US`);
  return TMDBPersonMovieCreditsSchema.parse(data);
};

export const getPersonTvCredits = async (
  tmdbPersonId: number,
): Promise<TMDBPersonTvCredits> => {
  const data = await fetchTMDB(`/person/${tmdbPersonId}/tv_credits?language=en-US`);
  return TMDBPersonTvCreditsSchema.parse(data);
};

export const getPersonExternalIds = async (
  tmdbPersonId: number,
): Promise<TMDBPersonExternalIds> => {
  const data = await fetchTMDB(`/person/${tmdbPersonId}/external_ids`);
  return TMDBPersonExternalIdsSchema.parse(data);
};

export const getPersonImages = async (
  tmdbPersonId: number,
): Promise<TMDBPersonImages> => {
  const data = await fetchTMDB(`/person/${tmdbPersonId}/images`);
  return TMDBPersonImagesSchema.parse(data);
};
