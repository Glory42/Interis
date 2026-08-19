import { InteractionsRepository } from "./repositories/interactions.repository";
import { SocialRepository } from "../social/repositories/social.repository";
import { SocialFeedService } from "../social/services/social-feed.service";
import { MoviesService } from "../movies/movies.service";
import type { UpdateInteractionDto } from "./dto/interactions.dto";

const toInteractionResponse = (row: {
  liked: boolean;
  watchlisted: boolean;
  rating: number | null;
  isWatched: boolean;
}) => {
  return {
    liked: row.liked,
    watchlisted: row.watchlisted,
    rating: row.rating,
    watched: row.isWatched,
  };
};

export class InteractionsService {
  // GET current state — null means no row yet (both false)
  static async get(userId: string, tmdbId: number) {
    const movie = await MoviesService.findOrCreate(tmdbId);
    const row = await InteractionsRepository.findByUserAndMovie(userId, movie.id);

    return toInteractionResponse(
      row ?? {
        liked: false,
        watchlisted: false,
        rating: null,
        isWatched: false,
      },
    );
  }

  // Upsert — only update the fields sent
  static async update(
    userId: string,
    tmdbId: number,
    input: UpdateInteractionDto,
  ) {
    const movie = await MoviesService.findOrCreate(tmdbId);
    const rating = input.rating;

    // Implicit watch if user liked or rated the movie
    const isImplicitlyWatched =
      input.liked === true ||
      (input.rating !== undefined && input.rating !== null);

    const upserted = await InteractionsRepository.upsertInteractionState(userId, movie.id, {
      liked: input.liked,
      watchlisted: input.watchlisted,
      rating: input.rating,
      watched: input.watched,
      isImplicitlyWatched,
    });

    // Write activity only for meaningful state changes
    if (input.liked === true) {
      await SocialRepository.insertActivity({
        userId,
        type: "liked_movie",
        entityId: String(movie.id),
        metadata: JSON.stringify({
          movieId: movie.id,
          tmdbId: movie.tmdbId,
          title: movie.title,
          posterPath: movie.posterPath,
        }),
      });
    }

    if (input.watchlisted === true) {
      await SocialRepository.insertActivity({
        userId,
        type: "watchlisted_movie",
        entityId: String(movie.id),
        metadata: JSON.stringify({
          movieId: movie.id,
          tmdbId: movie.tmdbId,
          title: movie.title,
          posterPath: movie.posterPath,
        }),
      });
    }

    if (input.liked === true || input.watchlisted === true) {
      SocialFeedService.invalidateFollowingFeed(userId);
    }

    return toInteractionResponse(
      upserted ?? {
        liked: input.liked ?? false,
        watchlisted: input.watchlisted ?? false,
        rating: rating ?? null,
        isWatched: input.watched ?? isImplicitlyWatched ?? false,
      },
    );
  }

  static async setWatched(userId: string, movieId: number): Promise<void> {
    await InteractionsRepository.markWatched(userId, movieId);
  }

  static async setWatchlisted(userId: string, movieId: number): Promise<void> {
    await InteractionsRepository.upsertField(userId, movieId, "watchlisted", true);
  }

  static async setRating(userId: string, movieId: number, ratingOutOfTen: number): Promise<void> {
    await InteractionsRepository.upsertField(userId, movieId, "rating", ratingOutOfTen);
  }

  static async hasRating(userId: string, movieId: number): Promise<boolean> {
    return InteractionsRepository.hasRating(userId, movieId);
  }
}
