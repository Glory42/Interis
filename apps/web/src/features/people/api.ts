import { z } from "zod";
import { apiRequest, type QueryRequestOptions } from "@/lib/api-client";
import {
  personRouteRoleSchema,
  type CreditMediaTab,
  type CreditRoleTab,
} from "@/features/people/shared";
import { mediaTypeSchema } from "@/types/api";

const personImageSchema = z.object({
  filePath: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  voteAverage: z.number(),
  voteCount: z.number().int().nonnegative(),
});

const personCreditItemSchema = z.object({
  mediaType: mediaTypeSchema,
  tmdbId: z.number().int().positive(),
  title: z.string(),
  originalTitle: z.string().nullable(),
  posterPath: z.string().nullable(),
  backdropPath: z.string().nullable(),
  releaseDate: z.string().nullable(),
  releaseYear: z.number().int().nullable(),
  character: z.string().nullable(),
  jobs: z.array(z.string()),
  department: z.string().nullable(),
  episodeCount: z.number().int().nullable(),
  voteAverage: z.number().nullable(),
  voteCount: z.number().int().nullable(),
});

const personCreditCountSchema = z.object({
  cast: z.number().int().nonnegative(),
  crew: z.number().int().nonnegative(),
});

const personCreditsPageSchema = z.object({
  items: z.array(personCreditItemSchema),
  total: z.number().int().nonnegative(),
});

const personDetailResponseSchema = z.object({
  person: z.object({
    tmdbPersonId: z.number().int().positive(),
    slug: z.string(),
    name: z.string(),
    knownForDepartment: z.string().nullable(),
    profilePath: z.string().nullable(),
    biography: z.string().nullable(),
    birthday: z.string().nullable(),
    deathday: z.string().nullable(),
    placeOfBirth: z.string().nullable(),
    popularity: z.number().nullable(),
    homepage: z.string().nullable(),
    alsoKnownAs: z.array(z.string()),
    roleHints: z.array(personRouteRoleSchema),
    externalIds: z.object({
      imdbId: z.string().nullable(),
      facebookId: z.string().nullable(),
      instagramId: z.string().nullable(),
      twitterId: z.string().nullable(),
      wikidataId: z.string().nullable(),
      tiktokId: z.string().nullable(),
      youtubeId: z.string().nullable(),
    }),
    images: z.object({
      profiles: z.array(personImageSchema),
    }),
    canonicalRoute: z.object({
      requestedRole: personRouteRoleSchema,
      requestedPath: z.string(),
      actorPath: z.string(),
      directorPath: z.string(),
      isCanonicalSlug: z.boolean(),
    }),
  }),
  credits: z.object({
    counts: z.object({
      combined: personCreditCountSchema,
      movies: personCreditCountSchema,
      tv: personCreditCountSchema,
    }),
    jobCounts: z.array(z.object({ job: z.string(), count: z.number().int().nonnegative() })),
  }),
});

export type PersonCreditItem = z.infer<typeof personCreditItemSchema>;
export type PersonCreditsPage = z.infer<typeof personCreditsPageSchema>;
export type PersonDetailResponse = z.infer<typeof personDetailResponseSchema>;

export const PERSON_CREDITS_PAGE_SIZE = 40;

export const getPersonDetailBySlug = async (
  role: z.infer<typeof personRouteRoleSchema>,
  slug: string,
  options: QueryRequestOptions = {},
): Promise<PersonDetailResponse> => {
  const response = await apiRequest<unknown>(`/api/people/${role}/${encodeURIComponent(slug)}`, {
    method: "GET",
    signal: options.signal,
  });

  return personDetailResponseSchema.parse(response);
};

export const getPersonCredits = async (
  role: z.infer<typeof personRouteRoleSchema>,
  slug: string,
  query: { media: CreditMediaTab; type: CreditRoleTab; offset: number },
  options: QueryRequestOptions = {},
): Promise<PersonCreditsPage> => {
  const params = new URLSearchParams({
    media: query.media,
    type: query.type,
    limit: String(PERSON_CREDITS_PAGE_SIZE),
    offset: String(query.offset),
  });
  const response = await apiRequest<unknown>(
    `/api/people/${role}/${encodeURIComponent(slug)}/credits?${params.toString()}`,
    { method: "GET", signal: options.signal },
  );

  return personCreditsPageSchema.parse(response);
};
