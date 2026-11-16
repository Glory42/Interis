import { createTtlCache } from "../../../infrastructure/cache/ttl-cache.helper";
import { FilmsService } from "../../films/films.service";
import { TvService } from "../../tv/tv.service";
import {
  ONBOARDING_MAX_TITLES,
  ONBOARDING_STAPLE_FILMS,
  ONBOARDING_STAPLE_SERIES,
  ONBOARDING_STAPLES_CACHE_TTL_MS,
} from "../constants/onboarding.constants";
import { interleaveTitles } from "../helpers/onboarding-titles.helper";
import { OnboardingRepository } from "../repositories/onboarding.repository";
import type { OnboardingTitle } from "../types/onboarding.types";

// The same for every viewer, so one read per TTL serves every new account.
const getCachedStaples = createTtlCache(
  () =>
    Promise.all([
      OnboardingRepository.findStapleFilms(ONBOARDING_STAPLE_FILMS),
      OnboardingRepository.findStapleSeries(ONBOARDING_STAPLE_SERIES),
    ]),
  { ttlMs: ONBOARDING_STAPLES_CACHE_TTL_MS, keyFn: () => "staples" },
);

// A TMDB outage only thins the grid; the staples still render.
const trendingFilms = async (): Promise<OnboardingTitle[]> => {
  const rows = await FilmsService.getTrending().catch(() => []);
  return rows.map((row) => ({
    mediaType: "movie",
    tmdbId: row.tmdbId,
    title: row.title,
    posterPath: row.posterPath,
    year: row.releaseYear,
  }));
};

const trendingSeries = async (): Promise<OnboardingTitle[]> => {
  const rows = await TvService.getTrending().catch(() => []);
  return rows.map((row) => ({
    mediaType: "tv",
    tmdbId: row.tmdbId,
    title: row.title,
    posterPath: row.posterPath,
    year: row.firstAirYear,
  }));
};

export class OnboardingTitlesService {
  static async getTitles(): Promise<OnboardingTitle[]> {
    const [films, series, [stapleFilms, stapleSeries]] = await Promise.all([
      trendingFilms(),
      trendingSeries(),
      getCachedStaples(),
    ]);
    return interleaveTitles([stapleFilms, films, stapleSeries, series], ONBOARDING_MAX_TITLES);
  }
}
