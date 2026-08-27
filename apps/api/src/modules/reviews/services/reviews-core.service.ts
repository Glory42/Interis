import { MoviesService } from "../../movies/movies.service";
import { MovieActivityRecorder } from "../../movies/services/movie-activity-recorder.service";
import { SerialsService } from "../../serials/serials.service";
import { SerialsReviewsRepository } from "../../serials/repositories/serials-reviews.repository";
import { SerialsInteractionsRepository } from "../../serials/repositories/serials-interactions.repository";
import { SerialsActivityRecorder } from "../../serials/services/serials-activity-recorder.service";
import { InteractionsService } from "../../interactions/interactions.service";
import { SocialFeedService } from "../../social/services/social-feed.service";
import { ReviewsRepository } from "../repositories/reviews.repository";
import { MusicCacheService } from "../../music/services/music-cache.service";
import { AlbumActivityRecorder } from "../../music/services/album-activity-recorder.service";
import { TracksCacheService } from "../../music/services/tracks-cache.service";
import { TrackActivityRecorder } from "../../music/services/track-activity-recorder.service";
import { BooksCacheService } from "../../books/services/books-cache.service";
import { BookActivityRecorder } from "../../books/services/book-activity-recorder.service";
import { buildReviewCreatedActivityMetadata } from "../helpers/reviews-activity.helper";
import type { CreateReviewDto, UpdateReviewDto } from "../dto/reviews.dto";
import { NotFoundError } from "../../../commons/errors/app-error";

type Movie = Awaited<ReturnType<typeof MoviesService.findOrCreate>>;
type Series = NonNullable<Awaited<ReturnType<typeof SerialsService.findOrCreate>>>;
type Album = NonNullable<Awaited<ReturnType<typeof MusicCacheService.findOrCreate>>>;
type Book = NonNullable<Awaited<ReturnType<typeof BooksCacheService.findOrCreate>>>;
type Track = NonNullable<Awaited<ReturnType<typeof TracksCacheService.findOrCreate>>>;
// SerialsReviewsRepository.upsertReview and DiaryRepository.upsertReview both
// delegate to ReviewsRepository.upsertReview now (see issue #48), so movie
// and TV reviews share one concrete row shape.
type ReviewsTableRow = NonNullable<Awaited<ReturnType<typeof ReviewsRepository.upsertReview>>>;
type MovieReviewRow = ReviewsTableRow;
type SeriesReviewRow = ReviewsTableRow;
type AlbumReviewRow = ReviewsTableRow;
type BookReviewRow = ReviewsTableRow;
type TrackReviewRow = ReviewsTableRow;

type ReviewRow = { id: string; containsSpoilers: boolean };

// findOrCreate and insertReview stay genuinely per-media-type - movies and
// TV write to the shared reviews table through two different repositories
// with different field shapes (see issue #48, not yet unified), and
// albums/books resolve through their own cache services. Everything
// downstream of them - marking watched, recording the activity, shaping the
// response - is written exactly once in createWithAdapter below, driven by
// whichever adapter gets resolved.
type ReviewMediaAdapter<TMedia, TReview extends ReviewRow, TResult> = {
  findOrCreateMedia: (mediaSourceId: string) => Promise<TMedia>;
  insertReview: (media: TMedia, input: CreateReviewDto, userId: string) => Promise<TReview | null>;
  markWatched: (userId: string, media: TMedia) => Promise<void>;
  recordActivity: (input: {
    userId: string;
    media: TMedia;
    review: TReview;
    extraMetadata: Record<string, unknown>;
  }) => void;
  toResult: (review: TReview, media: TMedia) => TResult;
};

const parseTmdbId = (mediaSourceId: string, label: string): number => {
  const tmdbId = Number.parseInt(mediaSourceId, 10);
  if (!Number.isFinite(tmdbId)) {
    throw new Error(`Invalid tmdbId for ${label}`);
  }
  return tmdbId;
};

const movieReviewAdapter: ReviewMediaAdapter<
  Movie,
  MovieReviewRow,
  { review: MovieReviewRow; movie: Movie }
> = {
  findOrCreateMedia: (mediaSourceId) =>
    MoviesService.findOrCreate(parseTmdbId(mediaSourceId, "movie")),
  insertReview: (movie, input, userId) =>
    ReviewsRepository.upsertReview({
      userId,
      mediaType: "movie",
      mediaSource: "tmdb",
      mediaSourceId: String(movie.tmdbId),
      movieId: movie.id,
      diaryEntryId: input.diaryEntryId ?? null,
      content: input.content,
      containsSpoilers: input.containsSpoilers ?? false,
    }),
  markWatched: (userId, movie) => InteractionsService.setWatched(userId, movie.id),
  recordActivity: ({ userId, media, review, extraMetadata }) => {
    MovieActivityRecorder.record({
      userId,
      movie: media,
      type: "review",
      entityId: review.id,
      extraMetadata,
    });
  },
  toResult: (review, movie) => ({ review, movie }),
};

const tvReviewAdapter: ReviewMediaAdapter<
  Series,
  SeriesReviewRow,
  { review: SeriesReviewRow; series: Series }
> = {
  findOrCreateMedia: async (mediaSourceId) => {
    const series = await SerialsService.findOrCreate(parseTmdbId(mediaSourceId, "tv"));
    if (!series) throw new NotFoundError("Series not found");
    return series;
  },
  insertReview: (series, input, userId) =>
    SerialsReviewsRepository.upsertReview({
      userId,
      seriesTmdbId: series.tmdbId,
      diaryEntryId: input.diaryEntryId ?? null,
      content: input.content,
      containsSpoilers: input.containsSpoilers ?? false,
    }),
  markWatched: (userId, series) => SerialsInteractionsRepository.setWatched(userId, series.id),
  recordActivity: ({ userId, media, review, extraMetadata }) => {
    SerialsActivityRecorder.record({
      userId,
      series: media,
      target: { kind: "series" },
      type: "review",
      entityId: review.id,
      extraMetadata,
    });
  },
  toResult: (review, series) => ({ review, series }),
};

const albumReviewAdapter: ReviewMediaAdapter<
  Album,
  AlbumReviewRow,
  { review: AlbumReviewRow; album: Album }
> = {
  findOrCreateMedia: async (mediaSourceId) => {
    const album = await MusicCacheService.findOrCreate(mediaSourceId);
    if (!album) throw new NotFoundError("Album not found");
    return album;
  },
  insertReview: (album, input, userId) =>
    ReviewsRepository.upsertReview({
      userId,
      mediaType: "album",
      mediaSource: "musicbrainz",
      mediaSourceId: album.mbid,
      movieId: null,
      diaryEntryId: input.diaryEntryId ?? null,
      content: input.content,
      containsSpoilers: input.containsSpoilers ?? false,
    }),
  // Albums have no "listened" flag on music_interaction to auto-set the way
  // movies/TV have isWatched - a review alone doesn't imply one here.
  markWatched: async () => {},
  recordActivity: ({ userId, media, review, extraMetadata }) => {
    AlbumActivityRecorder.record({
      userId,
      album: media,
      type: "review",
      entityId: review.id,
      extraMetadata,
    });
  },
  toResult: (review, album) => ({ review, album }),
};

const bookReviewAdapter: ReviewMediaAdapter<
  Book,
  BookReviewRow,
  { review: BookReviewRow; book: Book }
> = {
  findOrCreateMedia: async (mediaSourceId) => {
    const book = await BooksCacheService.findOrCreate(mediaSourceId);
    if (!book) throw new NotFoundError("Book not found");
    return book;
  },
  insertReview: (book, input, userId) =>
    ReviewsRepository.upsertReview({
      userId,
      mediaType: "book",
      mediaSource: "googlebooks",
      mediaSourceId: book.googleVolumeId,
      movieId: null,
      diaryEntryId: input.diaryEntryId ?? null,
      content: input.content,
      containsSpoilers: input.containsSpoilers ?? false,
    }),
  // Books have no "read" flag on book_interaction to auto-set - see the
  // album adapter's markWatched for the same reasoning.
  markWatched: async () => {},
  recordActivity: ({ userId, media, review, extraMetadata }) => {
    BookActivityRecorder.record({
      userId,
      book: media,
      type: "review",
      entityId: review.id,
      extraMetadata,
    });
  },
  toResult: (review, book) => ({ review, book }),
};

const trackReviewAdapter: ReviewMediaAdapter<
  Track,
  TrackReviewRow,
  { review: TrackReviewRow; track: Track }
> = {
  findOrCreateMedia: async (mediaSourceId) => {
    const track = await TracksCacheService.findOrCreate(mediaSourceId);
    if (!track) throw new NotFoundError("Track not found");
    return track;
  },
  insertReview: (track, input, userId) =>
    ReviewsRepository.upsertReview({
      userId,
      mediaType: "track",
      mediaSource: "musicbrainz",
      mediaSourceId: track.mbid,
      movieId: null,
      diaryEntryId: input.diaryEntryId ?? null,
      content: input.content,
      containsSpoilers: input.containsSpoilers ?? false,
    }),
  // Tracks have no "listened" flag on track_interaction to auto-set - see
  // the album adapter's markWatched for the same reasoning.
  markWatched: async () => {},
  recordActivity: ({ userId, media, review, extraMetadata }) => {
    TrackActivityRecorder.record({
      userId,
      track: media,
      type: "review",
      entityId: review.id,
      extraMetadata,
    });
  },
  toResult: (review, track) => ({ review, track }),
};

export class ReviewsCoreService {
  static async create(userId: string, input: CreateReviewDto) {
    if (input.mediaType === "tv") {
      return ReviewsCoreService.createWithAdapter(userId, input, tvReviewAdapter);
    }
    if (input.mediaType === "album") {
      return ReviewsCoreService.createWithAdapter(userId, input, albumReviewAdapter);
    }
    if (input.mediaType === "book") {
      return ReviewsCoreService.createWithAdapter(userId, input, bookReviewAdapter);
    }
    if (input.mediaType === "track") {
      return ReviewsCoreService.createWithAdapter(userId, input, trackReviewAdapter);
    }
    return ReviewsCoreService.createWithAdapter(userId, input, movieReviewAdapter);
  }

  private static async createWithAdapter<TMedia, TReview extends ReviewRow, TResult>(
    userId: string,
    input: CreateReviewDto,
    adapter: ReviewMediaAdapter<TMedia, TReview, TResult>,
  ): Promise<TResult> {
    const media = await adapter.findOrCreateMedia(input.mediaSourceId);
    const review = await adapter.insertReview(media, input, userId);
    if (!review) {
      throw new Error("Could not create review");
    }

    await adapter.markWatched(userId, media);

    adapter.recordActivity({
      userId,
      media,
      review,
      extraMetadata: buildReviewCreatedActivityMetadata({
        reviewId: review.id,
        content: input.content,
        containsSpoilers: review.containsSpoilers,
      }),
    });

    return adapter.toResult(review, media);
  }

  static async findById(reviewId: string) {
    return ReviewsRepository.findByIdWithLikeCount(reviewId);
  }

  static async findByMovie(movieId: number) {
    return ReviewsRepository.findByMovieId(movieId);
  }

  static async findByUser(userId: string) {
    return ReviewsRepository.findByUserId(userId);
  }

  static async update(reviewId: string, userId: string, input: UpdateReviewDto) {
    const updated = await ReviewsRepository.updateByIdAndUser(reviewId, userId, input);
    SocialFeedService.invalidateFollowingFeed(userId);
    return updated;
  }

  static async delete(reviewId: string, userId: string) {
    const deleted = await ReviewsRepository.deleteByIdAndUser(reviewId, userId);
    SocialFeedService.invalidateFollowingFeed(userId);
    return deleted;
  }

  // No ownership check — admin moderation only.
  static async deleteById(reviewId: string) {
    return ReviewsRepository.deleteById(reviewId);
  }

  // Movie reviews only — TV reviews live in the serials module's own table.
  static async listAllForAdmin(
    filters: { userId?: string; movieId?: number },
    limit: number,
    offset: number,
  ) {
    return ReviewsRepository.listAllForAdmin(filters, limit, offset);
  }
}
