import type { MediaType } from "../../media/constants/media-type.constant";

export type OnboardingTitle = {
  mediaType: MediaType;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  year: number | null;
};
