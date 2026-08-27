import { z } from "zod";

export const albumSchema = z.object({
  id: z.number().int(),
  mbid: z.string(),
  title: z.string(),
  artistName: z.string(),
  artistMbid: z.string().nullable(),
  coverArtUrl: z.string().nullable(),
  primaryType: z.string().nullable(),
  secondaryTypes: z.array(z.string()).optional().default([]),
  firstReleaseDate: z.string().nullable(),
  firstReleaseYear: z.number().int().nullable(),
  genres: z.array(z.object({ name: z.string(), count: z.number().int() })).optional().default([]),
  disambiguation: z.string().nullable(),
});

export const mbSearchResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  "primary-type": z.string().optional().nullable(),
  "first-release-date": z.string().optional(),
  "artist-credit": z.array(z.object({
    name: z.string(),
    joinphrase: z.string().optional(),
    artist: z.object({ id: z.string(), name: z.string() }).optional(),
  })).optional().default([]),
  tags: z.array(z.object({ name: z.string(), count: z.number() })).optional().default([]),
  disambiguation: z.string().optional().nullable(),
});

export const mbSearchResultListSchema = z.array(mbSearchResultSchema);

export const musicArchiveItemSchema = z.object({
  mbid: z.string(),
  title: z.string(),
  artistName: z.string(),
  coverArtUrl: z.string().nullable(),
  primaryType: z.string().nullable(),
  firstReleaseYear: z.number().int().nullable(),
  genres: z.array(z.object({ name: z.string(), count: z.number().int() })),
  logCount: z.number().int(),
  avgRating: z.number().nullable(),
  viewerHasLogged: z.boolean(),
  viewerWantToListen: z.boolean(),
});

export const musicArchiveResponseSchema = z.object({
  totalCount: z.number().int(),
  filteredCount: z.number().int(),
  selectedGenre: z.string().nullable(),
  selectedSort: z.string(),
  availableGenres: z.array(z.object({ name: z.string(), count: z.number().int() })),
  page: z.number().int(),
  limit: z.number().int(),
  hasMore: z.boolean(),
  nextPage: z.number().int().nullable(),
  items: z.array(musicArchiveItemSchema),
});

export const musicDetailReviewItemSchema = z.object({
  id: z.string(),
  content: z.string(),
  containsSpoilers: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  listenedDate: z.string().nullable(),
  rating: z.number().nullable(),
  likeCount: z.number().int(),
  viewerHasLiked: z.boolean(),
  author: z.object({
    id: z.string(),
    username: z.string(),
    displayUsername: z.string().nullable(),
    image: z.string().nullable(),
    avatarUrl: z.string().nullable(),
  }),
});

export const musicDetailResponseSchema = z.object({
  album: albumSchema,
  logsCount: z.number().int(),
  reviewCount: z.number().int(),
  userLog: z.object({
    diaryEntryId: z.string().nullable(),
    listenedDate: z.string().nullable(),
    relisten: z.boolean(),
    rating: z.number().nullable(),
  }).nullable(),
  interaction: z.object({
    liked: z.boolean(),
    wantToListen: z.boolean(),
    rating: z.number().nullable(),
  }).nullable(),
  reviewsSort: z.string(),
  reviews: z.array(musicDetailReviewItemSchema),
});

export const musicInteractionSchema = z.object({
  liked: z.boolean(),
  wantToListen: z.boolean(),
  rating: z.number().nullable(),
});

export const musicLogItemSchema = z.object({
  diaryEntryId: z.string(),
  listenedDate: z.string(),
  rating: z.number().nullable(),
  relisten: z.boolean(),
  createdAt: z.string(),
  username: z.string(),
  userDisplayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  reviewContent: z.string().nullable(),
  reviewContainsSpoilers: z.boolean().nullable(),
  reviewUpdatedAt: z.string().nullable(),
});

export const musicLogsListSchema = z.array(musicLogItemSchema);

export const myMusicLogSchema = z.object({
  id: z.string(),
  listenedDate: z.string(),
  rating: z.number().nullable(),
  relisten: z.boolean(),
  albumId: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
  albumMbid: z.string(),
  albumTitle: z.string(),
  albumArtistName: z.string(),
  albumCoverArtUrl: z.string().nullable(),
  albumFirstReleaseYear: z.number().int().nullable(),
  reviewId: z.string().nullable(),
  reviewContent: z.string().nullable(),
});

export const myMusicLogsListSchema = z.array(myMusicLogSchema);

export const updateMusicLogInputSchema = z.object({
  listenedDate: z.string().optional(),
  rating: z.number().min(0.5).max(10).multipleOf(0.5).nullable().optional(),
  relisten: z.boolean().optional(),
});

export const createMusicLogInputSchema = z.object({
  listenedDate: z.string(),
  rating: z.number().min(0.5).max(10).multipleOf(0.5).optional(),
  relisten: z.boolean().optional(),
});

export const updateMusicInteractionInputSchema = z.object({
  liked: z.boolean().optional(),
  wantToListen: z.boolean().optional(),
  rating: z.number().min(0.5).max(10).multipleOf(0.5).nullable().optional(),
});

export const editionListItemSchema = z.object({
  mbid: z.string(),
  title: z.string(),
  status: z.string().nullable(),
  packaging: z.string().nullable(),
  country: z.string().nullable(),
  releaseDate: z.string().nullable(),
  releaseYear: z.number().int().nullable(),
  format: z.string().nullable(),
  trackCount: z.number().int().nullable(),
  disambiguation: z.string().nullable(),
});

export const editionsResponseSchema = z.object({
  editions: z.array(editionListItemSchema),
});

export const editionTrackItemSchema = z.object({
  mbid: z.string(),
  title: z.string(),
  artistName: z.string(),
  length: z.number().int().nullable(),
  disambiguation: z.string().nullable(),
  discNumber: z.number().int(),
  position: z.number().int(),
});

export const editionTracklistResponseSchema = z.object({
  tracks: z.array(editionTrackItemSchema),
});
