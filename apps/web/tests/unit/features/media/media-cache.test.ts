import { describe, expect, it } from "vitest";
import { QueryClient, type QueryKey } from "@tanstack/react-query";
import { diaryKeys } from "@/features/diary/hooks/diary-keys";
import { feedKeys } from "@/features/feed/hooks/useFeed";
import { filmKeys } from "@/features/films/hooks/useFilms";
import { interactionKeys } from "@/features/interactions/hooks/interaction-keys";
import {
  refreshAfter,
  reviewEditedEvent,
  type MediaEvent,
  type MediaKind,
} from "@/features/media/media-cache";
import { profileKeys } from "@/features/profile/hooks/useProfile";
import { profileStatsKeys } from "@/features/profile/hooks/useProfileStats";
import { reviewKeys } from "@/features/reviews/hooks/review-keys";
import { seriesKeys } from "@/features/tv/hooks/tv/query-keys";

const VIEWER = "cinefan";
const FILM = 550;
const SERIES = 1399;

// Every query a refresh could touch, labelled by its role so Film and Series share one table.
const titleQueries = (kind: MediaKind): Record<string, QueryKey> =>
  kind === "film"
    ? {
        "title.detail": filmKeys.detail(FILM),
        "title.detailView": filmKeys.detailView(FILM, "recent"),
        "title.logs": filmKeys.logs(FILM),
        "title.interaction": interactionKeys.detail(FILM),
        "title.myReviews": reviewKeys.mineForTitle({ mediaType: "movie", tmdbId: FILM }),
        myLogs: diaryKeys.myLogs,
      }
    : {
        "title.detail": seriesKeys.detail(SERIES),
        "title.detailView": seriesKeys.detailView(SERIES, "recent"),
        "title.logs": seriesKeys.logs(SERIES),
        "title.interaction": seriesKeys.interaction(SERIES),
        "title.myReviews": reviewKeys.mineForTitle({ mediaType: "tv", tmdbId: SERIES }),
        "title.seasonDetail": seriesKeys.seasonDetail(SERIES, 1),
        "season.myReviews": reviewKeys.mineForTitle({ mediaType: "tv_season", tmdbId: SERIES, seasonNumber: 1 }),
        "episode.myReviews": reviewKeys.mineForTitle({
          mediaType: "tv_episode",
          tmdbId: SERIES,
          seasonNumber: 1,
          episodeNumber: 2,
        }),
        myLogs: seriesKeys.myLogs,
      };

const sharedQueries: Record<string, QueryKey> = {
  feed: feedKeys.grouped("all"),
  "feed.meSummary": feedKeys.meSummary,
  "feed.trending": feedKeys.trending(3),
  "profile.detail": profileKeys.detail(VIEWER),
  "profile.diary": profileKeys.diary(VIEWER),
  "profile.reviews": profileKeys.reviews(VIEWER),
  "profile.watchlist": [...profileKeys.watchlist(VIEWER), "all"],
  "profile.likes": [...profileKeys.likes(VIEWER), "all"],
  "profile.recentActivity": profileKeys.recentActivity(VIEWER, 20),
  "profile.stats": profileStatsKeys.detail(VIEWER),
  "profile.currentlyWatching": profileKeys.currentlyWatching(VIEWER),
  "profile.topPicks": profileKeys.topPicks(VIEWER),
  "other.user": profileKeys.detail("someone-else"),
  "other.film": filmKeys.detail(999),
  "other.series": seriesKeys.detail(999),
};

// Seeds Film and Series queries together, so an event for one kind can't leak into the other.
const invalidatedBy = async (kind: MediaKind, event: MediaEvent, viewer: string | null = VIEWER) => {
  const queryClient = new QueryClient();
  const own = { ...titleQueries(kind), ...sharedQueries };
  const all = [...Object.values(titleQueries("film")), ...Object.values(titleQueries("tv")), ...Object.values(sharedQueries)];
  for (const key of all) queryClient.setQueryData(key, {});

  await refreshAfter(queryClient, event, viewer);

  const labelOf = (key: QueryKey) =>
    Object.entries(own).find(([, ownKey]) => JSON.stringify(ownKey) === JSON.stringify(key))?.[0] ??
    `foreign:${JSON.stringify(key)}`;
  return all
    .filter((key) => queryClient.getQueryState(key)?.isInvalidated)
    .map(labelOf)
    .sort();
};

const tmdbIdOf = (kind: MediaKind) => (kind === "film" ? FILM : SERIES);
const TITLE = ["title.detail", "title.detailView", "title.logs", "title.interaction"];
const REVIEW_TITLE = ["title.detailView", "title.logs", "myLogs", "title.myReviews"];
const LOG = [...TITLE, "myLogs", "title.myReviews", "feed.meSummary", "profile.detail", "profile.diary", "profile.recentActivity", "profile.stats"];
const INTERACTION = [...TITLE, "profile.detail", "profile.stats", "profile.watchlist"];

type Row = {
  name: string;
  event: (kind: MediaKind) => MediaEvent;
  both: string[];
  tvOnly?: string[];
};

const rows: Row[] = [
  {
    name: "log created with a review",
    event: (kind) => ({ type: "log-created", kind, tmdbId: tmdbIdOf(kind), hasReview: true }),
    both: [...LOG, "profile.watchlist", "profile.reviews"],
    tvOnly: ["title.seasonDetail", "profile.currentlyWatching"],
  },
  {
    name: "log created without a review",
    event: (kind) => ({ type: "log-created", kind, tmdbId: tmdbIdOf(kind), hasReview: false }),
    both: [...LOG, "profile.watchlist"],
    tvOnly: ["title.seasonDetail", "profile.currentlyWatching"],
  },
  {
    name: "log edited",
    event: (kind) => ({ type: "log-edited", kind, tmdbId: tmdbIdOf(kind) }),
    both: [...LOG, "profile.reviews"],
    tvOnly: ["title.seasonDetail"],
  },
  {
    name: "log deleted, kept watched",
    event: (kind) => ({ type: "log-deleted", kind, tmdbId: tmdbIdOf(kind), unwatch: false }),
    both: [...LOG, "profile.reviews"],
    tvOnly: ["title.seasonDetail"],
  },
  {
    name: "log deleted and unwatched",
    event: (kind) => ({ type: "log-deleted", kind, tmdbId: tmdbIdOf(kind), unwatch: true }),
    both: [...LOG, "profile.reviews"],
    tvOnly: ["title.seasonDetail", "profile.currentlyWatching"],
  },
  {
    name: "review created",
    event: (kind) => ({ type: "review-created", kind, tmdbId: tmdbIdOf(kind) }),
    both: [...REVIEW_TITLE, "profile.detail", "profile.reviews", "profile.recentActivity"],
  },
  {
    name: "review edited",
    event: (kind) => ({ type: "review-edited", title: { kind, tmdbId: tmdbIdOf(kind) } }),
    both: [...REVIEW_TITLE, "profile.reviews", "profile.diary", "profile.recentActivity"],
  },
  {
    name: "review deleted",
    event: (kind) => ({ type: "review-deleted", kind, tmdbId: tmdbIdOf(kind) }),
    both: [...REVIEW_TITLE, "profile.detail", "profile.reviews", "profile.diary", "profile.recentActivity"],
  },
  {
    name: "liked",
    event: (kind) => ({ type: "interaction-changed", kind, tmdbId: tmdbIdOf(kind), input: { liked: true } }),
    both: [...INTERACTION, "profile.likes", "profile.recentActivity"],
  },
  {
    name: "watchlisted",
    event: (kind) => ({ type: "interaction-changed", kind, tmdbId: tmdbIdOf(kind), input: { watchlisted: true } }),
    both: [...INTERACTION, "profile.recentActivity"],
  },
  {
    name: "rated",
    event: (kind) => ({ type: "interaction-changed", kind, tmdbId: tmdbIdOf(kind), input: { rating: 8 } }),
    both: [...INTERACTION, "profile.recentActivity"],
  },
  {
    name: "watched toggled",
    event: (kind) => ({ type: "interaction-changed", kind, tmdbId: tmdbIdOf(kind), input: { watched: true } }),
    both: INTERACTION,
    tvOnly: ["title.seasonDetail", "profile.currentlyWatching"],
  },
];

describe("media cache refresh: event × media kind", () => {
  for (const row of rows) {
    for (const kind of ["film", "tv"] as const) {
      it(`${row.name} (${kind})`, async () => {
        const expected = ["feed", ...row.both, ...(kind === "tv" ? (row.tvOnly ?? []) : [])].sort();
        expect(await invalidatedBy(kind, row.event(kind))).toEqual(expected);
      });
    }
  }

  it("series watch status set", async () => {
    const event: MediaEvent = { type: "interaction-changed", kind: "tv", tmdbId: SERIES, input: { watchStatus: "paused" } };
    expect(await invalidatedBy("tv", event)).toEqual(["feed", ...INTERACTION, "profile.currentlyWatching"].sort());
  });

  const SEASON = ["feed", "title.detailView", "title.seasonDetail", "title.interaction"];
  const PROGRESS = ["profile.currentlyWatching", "profile.stats"];
  it.each<[string, MediaEvent, string[]]>([
    [
      "season watched",
      { type: "season-interaction-changed", tmdbId: SERIES, seasonNumber: 1, input: { watched: true } },
      PROGRESS,
    ],
    [
      "season liked",
      { type: "season-interaction-changed", tmdbId: SERIES, seasonNumber: 1, input: { liked: true } },
      ["profile.recentActivity"],
    ],
    [
      "episode watched",
      { type: "episode-interaction-changed", tmdbId: SERIES, seasonNumber: 1, episodeNumber: 2, input: { watched: true } },
      PROGRESS,
    ],
    [
      "episode rated (may watch it implicitly)",
      { type: "episode-interaction-changed", tmdbId: SERIES, seasonNumber: 1, episodeNumber: 2, input: { rating: 7 } },
      [...PROGRESS, "profile.recentActivity"],
    ],
    [
      "episodes watched through",
      { type: "episodes-watched-through", tmdbId: SERIES, seasonNumber: 1, episodeNumber: 3 },
      PROGRESS,
    ],
  ])("%s", async (_name, event, viewerKeys) => {
    expect(await invalidatedBy("tv", event)).toEqual([...SEASON, ...viewerKeys].sort());
  });

  it("season review changed", async () => {
    const event: MediaEvent = { type: "season-review-changed", tmdbId: SERIES, seasonNumber: 1, episodeNumber: null };
    expect(await invalidatedBy("tv", event)).toEqual(
      ["feed", "title.detailView", "season.myReviews", "profile.recentActivity"].sort(),
    );
  });

  it("episode review changed", async () => {
    const event: MediaEvent = { type: "season-review-changed", tmdbId: SERIES, seasonNumber: 1, episodeNumber: 2 };
    expect(await invalidatedBy("tv", event)).toEqual(
      ["feed", "title.seasonDetail", "episode.myReviews", "profile.recentActivity"].sort(),
    );
  });

  it("review edited on an unknown title refreshes only the viewer's pages and the feed", async () => {
    expect(await invalidatedBy("film", { type: "review-edited", title: null })).toEqual(
      ["feed", "profile.diary", "profile.recentActivity", "profile.reviews"].sort(),
    );
  });

  it("signed out: only the title and the feed", async () => {
    expect(await invalidatedBy("film", { type: "interaction-changed", kind: "film", tmdbId: FILM, input: { liked: true } }, null)).toEqual(
      ["feed", ...TITLE].sort(),
    );
  });
});

describe("reviewEditedEvent", () => {
  it.each([
    [{ mediaType: "movie", mediaSourceId: "550" }, { type: "review-edited", title: { kind: "film", tmdbId: 550 } }],
    [{ mediaType: "tv", mediaSourceId: "1399" }, { type: "review-edited", title: { kind: "tv", tmdbId: 1399 } }],
    [
      { mediaType: "tv_season", mediaSourceId: "1399:2" },
      { type: "season-review-changed", tmdbId: 1399, seasonNumber: 2, episodeNumber: null },
    ],
    [
      { mediaType: "tv_episode", mediaSourceId: "1399:2:5" },
      { type: "season-review-changed", tmdbId: 1399, seasonNumber: 2, episodeNumber: 5 },
    ],
    [{}, { type: "review-edited", title: null }],
    [{ mediaType: "movie", mediaSourceId: "abc" }, { type: "review-edited", title: null }],
  ])("%o", (review, expected) => {
    expect(reviewEditedEvent(review)).toEqual(expected);
  });
});
