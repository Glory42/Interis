import { MoviesService } from "../../movies/movies.service";
import { SerialsService } from "../../serials/serials.service";
import { SerialsInteractionsRepository } from "../../serials/repositories/serials-interactions.repository";
import {
  ActivityRecorder,
  type ActivitySubject,
} from "../../social/services/activity-recorder.service";
import { InteractionsService } from "../../interactions/interactions.service";
import { SocialFeedService } from "../../social/services/social-feed.service";
import { ReviewsRepository } from "../repositories/reviews.repository";
import { buildReviewCreatedActivityMetadata } from "../helpers/reviews-activity.helper";
import type { CreateReviewDto, UpdateReviewDto } from "../dto/reviews.dto";
import type { MediaType } from "../../media/constants/media-type.constant";
import { NotFoundError } from "../../../commons/errors/app-error";

type Movie = Awaited<ReturnType<typeof MoviesService.findOrCreate>>;
type Series = NonNullable<Awaited<ReturnType<typeof SerialsService.findOrCreate>>>;
type ReviewsTableRow = NonNullable<Awaited<ReturnType<typeof ReviewsRepository.upsertReview>>>;

// Only the genuinely per-media-type facts: how to resolve the media, how to
// address its review row, where "watched" gets marked, how the activity
// subject is shaped, and which key the HTTP response uses. The whole write
// sequence - upsert the row, mark watched, record the activity - is
// createWithAdapter below, written once.
type ReviewMediaAdapter<TMedia, TResult> = {
  findOrCreateMedia: (tmdbId: number) => Promise<TMedia>;
  reviewRef: (media: TMedia) => { mediaType: MediaType; tmdbId: number; movieId: number | null };
  markWatched: (userId: string, media: TMedia) => Promise<void>;
  activitySubject: (media: TMedia) => ActivitySubject;
  toResult: (review: ReviewsTableRow, media: TMedia) => TResult;
};

const movieReviewAdapter: ReviewMediaAdapter<Movie, { review: ReviewsTableRow; movie: Movie }> = {
  findOrCreateMedia: (tmdbId) => MoviesService.findOrCreate(tmdbId),
  reviewRef: (movie) => ({ mediaType: "movie", tmdbId: movie.tmdbId, movieId: movie.id }),
  markWatched: (userId, movie) => InteractionsService.setWatched(userId, movie.id),
  activitySubject: (movie) => ({ kind: "movie", movie }),
  toResult: (review, movie) => ({ review, movie }),
};

const tvReviewAdapter: ReviewMediaAdapter<Series, { review: ReviewsTableRow; series: Series }> = {
  findOrCreateMedia: async (tmdbId) => {
    const series = await SerialsService.findOrCreate(tmdbId);
    if (!series) throw new NotFoundError("Series not found");
    return series;
  },
  reviewRef: (series) => ({ mediaType: "tv", tmdbId: series.tmdbId, movieId: null }),
  markWatched: (userId, series) => SerialsInteractionsRepository.setWatched(userId, series.id),
  activitySubject: (series) => ({ kind: "series", series }),
  toResult: (review, series) => ({ review, series }),
};

export class ReviewsCoreService {
  static async create(userId: string, input: CreateReviewDto) {
    if (input.mediaType === "tv") {
      return ReviewsCoreService.createWithAdapter(userId, input, tvReviewAdapter);
    }
    return ReviewsCoreService.createWithAdapter(userId, input, movieReviewAdapter);
  }

  private static async createWithAdapter<TMedia, TResult>(
    userId: string,
    input: CreateReviewDto,
    adapter: ReviewMediaAdapter<TMedia, TResult>,
  ): Promise<TResult> {
    const media = await adapter.findOrCreateMedia(input.tmdbId);
    const ref = adapter.reviewRef(media);

    const review = await ReviewsRepository.upsertReview({
      userId,
      mediaType: ref.mediaType,
      tmdbId: ref.tmdbId,
      movieId: ref.movieId,
      diaryEntryId: input.diaryEntryId ?? null,
      content: input.content,
      containsSpoilers: input.containsSpoilers ?? false,
    });
    if (!review) {
      throw new Error("Could not create review");
    }

    await adapter.markWatched(userId, media);

    ActivityRecorder.recordMedia({
      userId,
      subject: adapter.activitySubject(media),
      type: "review",
      entityId: review.id,
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
