import { z } from "zod";
import { apiRequest } from "@/lib/api-client";
import { personRouteRoleSchema } from "@/features/people/shared";

const personImageSchema = z.object({
  filePath: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  voteAverage: z.number(),
  voteCount: z.number().int().nonnegative(),
});

const personCreditItemSchema = z.object({
  mediaType: z.enum(["movie", "tv"]),
  tmdbId: z.number().int().positive(),
  title: z.string(),
  originalTitle: z.string().nullable(),
  posterPath: z.string().nullable(),
  backdropPath: z.string().nullable(),
  releaseDate: z.string().nullable(),
  releaseYear: z.number().int().nullable(),
  character: z.string().nullable(),
  job: z.string().nullable(),
  department: z.string().nullable(),
  episodeCount: z.number().int().nullable(),
  voteAverage: z.number().nullable(),
  voteCount: z.number().int().nullable(),
});

const personCreditGroupSchema = z.object({
  cast: z.array(personCreditItemSchema),
  crew: z.array(personCreditItemSchema),
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
    combined: personCreditGroupSchema,
    movies: personCreditGroupSchema,
    tv: personCreditGroupSchema,
  }),
});

export type PersonCreditItem = z.infer<typeof personCreditItemSchema>;
export type PersonCreditGroup = z.infer<typeof personCreditGroupSchema>;
export type PersonDetailResponse = z.infer<typeof personDetailResponseSchema>;

type QueryRequestOptions = {
  signal?: AbortSignal;
};

export const getPersonDetailBySlug = async (
  role: z.infer<typeof personRouteRoleSchema>,
  slug: string,
  options: QueryRequestOptions = {},
): Promise<PersonDetailResponse> => {
  const response = await apiRequest<unknown>(`/api/people/${role}/${encodeURIComponent(slug)}`, {
    method: "GET",
    signal: options.signal,
    cache: "no-store",
  });

  return personDetailResponseSchema.parse(response);
};
