import { z } from "zod";

export const googleBooksVolumeInfoSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  authors: z.array(z.string()).optional().default([]),
  publisher: z.string().optional(),
  publishedDate: z.string().optional(),
  description: z.string().optional(),
  pageCount: z.number().int().optional(),
  language: z.string().optional(),
  categories: z.array(z.string()).optional().default([]),
  imageLinks: z.object({
    smallThumbnail: z.string().optional(),
    thumbnail: z.string().optional(),
  }).optional(),
});

export const googleBooksVolumeSchema = z.object({
  id: z.string(),
  volumeInfo: googleBooksVolumeInfoSchema,
});

export const googleBooksSearchResponseSchema = z.array(googleBooksVolumeSchema);

export const bookDetailSchema = z.object({
  id: z.number().int(),
  googleVolumeId: z.string(),
  title: z.string(),
  subtitle: z.string().nullable(),
  authors: z.array(z.string()),
  publisher: z.string().nullable(),
  publishedDate: z.string().nullable(),
  publishedYear: z.number().int().nullable(),
  pageCount: z.number().int().nullable(),
  language: z.string().nullable(),
  categories: z.array(z.string()),
  description: z.string().nullable(),
  coverImageUrl: z.string().nullable(),
  isbn13: z.string().nullable(),
  googleBooksUrl: z.string().nullable(),
});

export const booksArchiveItemSchema = z.object({
  googleVolumeId: z.string(),
  title: z.string(),
  authors: z.array(z.string()),
  coverImageUrl: z.string().nullable(),
  publishedYear: z.number().int().nullable(),
  language: z.string().nullable(),
  categories: z.array(z.string()),
  logCount: z.number().int(),
  avgRating: z.number().nullable(),
  viewerHasLogged: z.boolean(),
  viewerWantToRead: z.boolean(),
});

export const booksArchiveResponseSchema = z.object({
  totalCount: z.number().int(),
  filteredCount: z.number().int(),
  selectedGenre: z.string().nullable(),
  selectedLanguage: z.string().nullable(),
  selectedSort: z.string(),
  availableGenres: z.array(z.object({ name: z.string(), count: z.number().int() })),
  page: z.number().int(),
  limit: z.number().int(),
  hasMore: z.boolean(),
  nextPage: z.number().int().nullable(),
  items: z.array(booksArchiveItemSchema),
});

export const bookDetailReviewItemSchema = z.object({
  id: z.string(),
  content: z.string(),
  containsSpoilers: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  readDate: z.string().nullable(),
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

export const bookDetailResponseSchema = z.object({
  book: bookDetailSchema,
  logsCount: z.number().int(),
  reviewCount: z.number().int(),
  userLog: z.object({
    diaryEntryId: z.string().nullable(),
    readDate: z.string().nullable(),
    reread: z.boolean(),
    rating: z.number().nullable(),
  }).nullable(),
  interaction: z.object({
    liked: z.boolean(),
    wantToRead: z.boolean(),
    rating: z.number().nullable(),
  }).nullable(),
  reviewsSort: z.string(),
  reviews: z.array(bookDetailReviewItemSchema),
});

export const bookInteractionSchema = z.object({
  liked: z.boolean(),
  wantToRead: z.boolean(),
  rating: z.number().nullable(),
});

export const bookLogItemSchema = z.object({
  diaryEntryId: z.string(),
  readDate: z.string(),
  rating: z.number().nullable(),
  reread: z.boolean(),
  createdAt: z.string(),
  username: z.string(),
  userDisplayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  reviewContent: z.string().nullable(),
  reviewContainsSpoilers: z.boolean().nullable(),
  reviewUpdatedAt: z.string().nullable(),
});

export const bookLogsListSchema = z.array(bookLogItemSchema);

export const myBookLogSchema = z.object({
  id: z.string(),
  readDate: z.string(),
  rating: z.number().nullable(),
  reread: z.boolean(),
  bookId: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
  bookGoogleVolumeId: z.string(),
  bookTitle: z.string(),
  bookAuthors: z.array(z.string()),
  bookCoverImageUrl: z.string().nullable(),
  bookPublishedYear: z.number().int().nullable(),
  reviewId: z.string().nullable(),
  reviewContent: z.string().nullable(),
});

export const myBookLogsListSchema = z.array(myBookLogSchema);

export const updateBookLogInputSchema = z.object({
  readDate: z.string().optional(),
  rating: z.number().min(0.5).max(10).multipleOf(0.5).nullable().optional(),
  reread: z.boolean().optional(),
});

export const createBookLogInputSchema = z.object({
  readDate: z.string(),
  rating: z.number().min(0.5).max(10).multipleOf(0.5).optional(),
  reread: z.boolean().optional(),
});

export const createBookLogResultSchema = z
  .object({
    entry: z.object({ id: z.string() }).passthrough(),
  })
  .passthrough();

export const updateBookInteractionInputSchema = z.object({
  liked: z.boolean().optional(),
  wantToRead: z.boolean().optional(),
  rating: z.number().min(0.5).max(10).multipleOf(0.5).nullable().optional(),
});
