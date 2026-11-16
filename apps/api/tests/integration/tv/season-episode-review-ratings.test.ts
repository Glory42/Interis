import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { signUpTestUser } from "../../support/app/auth-flow";
import { seedTestSeries } from "../../support/factories/media.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import { db } from "../../../src/infrastructure/database/db";
import { user } from "../../../src/infrastructure/database/auth.entity";
import { reviews } from "../../../src/modules/reviews/reviews.entity";
import { seriesEpisodeInteractions, seriesSeasonInteractions } from "../../../src/modules/tv/tv.entity";
import { TvSeasonEpisodeReviewsRepository } from "../../../src/modules/tv/repositories/tv-season-episode-reviews.repository";
import { SocialFeedSeriesReviewRepository } from "../../../src/modules/social/repositories/social-feed-series-review.repository";

const userIdOf = async (username: string): Promise<string> => {
  const [row] = await db.select({ id: user.id }).from(user).where(eq(user.username, username));
  if (!row) throw new Error(`Test user ${username} not found`);
  return row.id;
};

// Ratings come from the review author's own season/episode interaction; other
// viewers' watched-episode rows for the same series must not leak in.
describe("season/episode review ratings", () => {
  let testServer: RunningTestServer | null = null;

  beforeAll(async () => {
    testServer = await startTestServer();
  });

  afterAll(async () => {
    if (!testServer) return;
    await testServer.close();
    testServer = null;
  });

  it("resolves each review's rating from its author's interaction only", async () => {
    const series = await seedTestSeries("Season Episode Review Ratings Serial");
    const baseUrl = testServer!.baseUrl;
    const author = await signUpTestUser(baseUrl, "serauthor");
    const watcher = await signUpTestUser(baseUrl, "serwatch");
    const [authorId, watcherId] = await Promise.all([userIdOf(author.username), userIdOf(watcher.username)]);

    const [seasonReview, episodeReview] = await db
      .insert(reviews)
      .values([
        { userId: authorId, mediaType: "tv_season", mediaSourceId: `${series.tmdbId}:1`, content: "season" },
        { userId: authorId, mediaType: "tv_episode", mediaSourceId: `${series.tmdbId}:1:2`, content: "episode" },
      ])
      .returning({ id: reviews.id });

    await db.insert(seriesSeasonInteractions).values([
      { userId: authorId, seriesId: series.id, seasonNumber: 1, rating: 7 },
      { userId: watcherId, seriesId: series.id, seasonNumber: 1, rating: 2 },
    ]);
    await db.insert(seriesEpisodeInteractions).values([
      { userId: authorId, seriesId: series.id, seasonNumber: 1, episodeNumber: 2, rating: 9 },
      { userId: watcherId, seriesId: series.id, seasonNumber: 1, episodeNumber: 2, rating: 1 },
      { userId: watcherId, seriesId: series.id, seasonNumber: 1, episodeNumber: 3, watched: true },
    ]);

    const detailRows = await TvSeasonEpisodeReviewsRepository.getReviewRowsBySeriesId(series.tmdbId, series.id);
    const ratingById = new Map(detailRows.map((row) => [row.id, row.rating]));
    expect(ratingById.get(seasonReview!.id)).toBe(7);
    expect(ratingById.get(episodeReview!.id)).toBe(9);

    const feedRows = await SocialFeedSeriesReviewRepository.getSeasonEpisodeReviewRows([
      seasonReview!.id,
      episodeReview!.id,
    ]);
    const feedRatingById = new Map(feedRows.map((row) => [row.id, row.rating]));
    expect(feedRatingById.get(seasonReview!.id)).toBe(7);
    expect(feedRatingById.get(episodeReview!.id)).toBe(9);
  });
});
