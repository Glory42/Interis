import { MoviesService } from "../../movies/movies.service";
import { MovieActivityRecorder } from "../../movies/services/movie-activity-recorder.service";
import { SerialsService } from "../../serials/serials.service";
import { SerialsReviewsRepository } from "../../serials/repositories/serials-reviews.repository";
import { SerialsInteractionsRepository } from "../../serials/repositories/serials-interactions.repository";
import { SerialsActivityRecorder } from "../../serials/services/serials-activity-recorder.service";
import { InteractionsService } from "../../interactions/interactions.service";
import { SocialFeedService } from "../../social/services/social-feed.service";
import { ReviewsRepository } from "../repositories/reviews.repository";
import { buildReviewCreatedActivityMetadata } from "../helpers/reviews-activity.helper";
import type { CreateReviewDto, UpdateReviewDto } from "../dto/reviews.dto";
import { NotFoundError } from "../../../commons/errors/app-error";

type Movie = Awaited<ReturnType<typeof MoviesService.findOrCreate>>;
type Series = NonNullable<Awaited<ReturnType<typeof SerialsService.findOrCreate>>>;
type MovieReviewRow = NonNullable<Awaited<ReturnType<typeof ReviewsRepository.insertMovieReview>>>;
type SeriesReviewRow = NonNullable<Awaited<ReturnType<typeof SerialsReviewsRepository.upsertReview>>>;

type ReviewRow = { id: string; containsSpoilers: boolean };

// findOrCreate and insertReview stay genuinely per-media-type - movies and
// TV write to the shared reviews table through two different repositories
// with different field shapes (see issue #48, not yet unified). Everything
// downstream of them - marking watched, recording the activity, shaping the
// response - is written exactly once in createWithAdapter below, driven by
// whichever adapter gets resolved.
type ReviewMediaAdapter<TMedia, TReview extends ReviewRow, TResult> = {
  findOrCreateMedia: (tmdbId: number) => Promise<TMedia>;
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

const movieReviewAdapter: ReviewMediaAdapter<
  Movie,
  MovieReviewRow,
  { review: MovieReviewRow; movie: Movie }
> = {
  findOrCreateMedia: (tmdbId) => MoviesService.findOrCreate(tmdbId),
  insertReview: (movie, input, userId) =>
    ReviewsRepository.insertMovieReview({
      userId,
      movieId: movie.id,
      movieTmdbId: movie.tmdbId,
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
  findOrCreateMedia: async (tmdbId) => {
    const series = await SerialsService.findOrCreate(tmdbId);
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

export class ReviewsCoreService {
  static async create(userId: string, input: CreateReviewDto) {
    if (input.mediaType === "tv") {
      return ReviewsCoreService.createWithAdapter(userId, input, tvReviewAdapter);
    }
    return ReviewsCoreService.createWithAdapter(userId, input, movieReviewAdapter);
  }

  private static async createWithAdapter<TMedia, TReview extends ReviewRow, TResult>(
    userId: string,
    input: CreateReviewDto,
    adapter: ReviewMediaAdapter<TMedia, TReview, TResult>,
  ): Promise<TResult> {
    const media = await adapter.findOrCreateMedia(input.tmdbId);
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
