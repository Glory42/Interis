import { MediaInteractions } from "../media-interactions/media-interactions.repository";
import { SocialRepository } from "../social/repositories/social.repository";
import { SocialFeedService } from "../social/services/social-feed.service";
import { MoviesService } from "../movies/movies.service";
import type { UpdateInteractionDto } from "./dto/interactions.dto";

const movieInteractionStore = MediaInteractions.forMovie();

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
    const row = await movieInteractionStore.find(userId, movie.id);

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

    const upserted = await movieInteractionStore.upsertState(userId, movie.id, {
      liked: input.liked,
      watchlisted: input.watchlisted,
      rating: input.rating,
      watched: input.watched,
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
        rating: input.rating ?? null,
        isWatched: input.watched ?? false,
      },
    );
  }

  static async setWatched(userId: string, movieId: number): Promise<void> {
    await movieInteractionStore.markWatched(userId, movieId);
  }

  static async setWatchlisted(userId: string, movieId: number): Promise<void> {
    await movieInteractionStore.setWatchlisted(userId, movieId);
  }

  static async setRating(userId: string, movieId: number, ratingOutOfTen: number): Promise<void> {
    await movieInteractionStore.setRating(userId, movieId, ratingOutOfTen);
  }

  static async hasRating(userId: string, movieId: number): Promise<boolean> {
    return movieInteractionStore.hasRating(userId, movieId);
  }
}
