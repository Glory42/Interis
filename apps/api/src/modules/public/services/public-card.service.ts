import {
  renderListCard,
  renderMediaCard,
  renderProfileCard,
  renderRecapCard,
  renderRecapStoryCard,
  renderReviewCard,
  type ShareCard,
} from "../../../infrastructure/share-cards";
import { tmdbImageUrl } from "../../../infrastructure/tmdb/tmdb-images.helper";
import { recapCardStats, recapHighlight, recapVersion } from "../helpers/recap-share.helper";
import { PublicShareReadService } from "./public-share-read.service";

export type ShareCardKind = "review" | "list" | "profile" | "movie" | "serial" | "recap" | "recap-story";

type VersionedCard = { card: ShareCard; version: string | null };

const CARD_TTL_MS = 10 * 60 * 1000;
// Cards are ~80–130 KB each as JPEG.
const CARD_CACHE_MAX_ENTRIES = 120;
const RENDER_TIMEOUT_MS = 8_000;

const cache = new Map<string, VersionedCard & { expiresAt: number }>();
const inFlight = new Map<string, Promise<VersionedCard | null>>();

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Share card render timed out after ${ms}ms`)), ms);
    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });

// One DB read (plus TMDB artwork) per card.
const loadAndRender = async (kind: ShareCardKind, id: string): Promise<VersionedCard | null> => {
  switch (kind) {
    case "review": {
      const review = await PublicShareReadService.getReview(id);
      if (!review) return null;
      const card = await renderReviewCard({
        ...review,
        posterUrl: tmdbImageUrl(review.posterPath, "w342"),
        backdropUrl: tmdbImageUrl(review.backdropPath, "w780"),
      });
      return { card, version: review.version };
    }
    case "list": {
      const list = await PublicShareReadService.getList(id);
      if (!list) return null;
      const card = await renderListCard({
        ...list,
        posterUrls: list.posterPaths.map((path) => tmdbImageUrl(path, "w342")).filter((url) => url !== null),
      });
      return { card, version: list.version };
    }
    case "profile": {
      const profile = await PublicShareReadService.getProfile(id);
      if (!profile) return null;
      const card = await renderProfileCard({
        ...profile,
        stats: [
          { label: "Film logs", value: profile.filmLogCount },
          { label: "TV logs", value: profile.seriesLogCount },
          { label: "Reviews", value: profile.reviewCount },
          { label: "Followers", value: profile.followerCount },
        ],
        favoritePosterUrls: profile.favoritePosterPaths.map((path) => tmdbImageUrl(path, "w342")).filter((url) => url !== null),
      });
      return { card, version: null };
    }
    case "recap": {
      // The id is "<username>/<year>", checked by the controller.
      const [username = "", year = ""] = id.split("/");
      const recap = await PublicShareReadService.getYearReview(username, Number(year));
      if (!recap) return null;
      const card = await renderRecapCard({
        ...recap.user,
        year: recap.year,
        isPartialYear: recap.isPartialYear,
        stats: recapCardStats(recap),
        highlight: recapHighlight(recap),
        posterUrls: recap.posterPaths.map((path) => tmdbImageUrl(path, "w342")).filter((url) => url !== null),
      });
      return { card, version: recapVersion(recap) };
    }
    case "recap-story": {
      // The id is "<username>/<year>", checked by the controller.
      const [username = "", year = ""] = id.split("/");
      const recap = await PublicShareReadService.getYearReview(username, Number(year));
      if (!recap?.persona) return null;
      const card = await renderRecapStoryCard({
        displayName: recap.user.displayName,
        username: recap.user.username,
        year: recap.year,
        isPartialYear: recap.isPartialYear,
        persona: recap.persona,
        totals: {
          films: recap.totals.films,
          series: recap.totals.series,
          episodes: recap.totals.episodes,
          hours: recap.totals.hoursWatched,
        },
        avatarUrl: recap.user.avatarUrl,
        backdropUrl: tmdbImageUrl(recap.topFilm?.backdropPath, "w1280"),
        topFilmTitle: recap.topFilm?.title ?? null,
        posterUrls: recap.posterPaths
          .map((path) => tmdbImageUrl(path, "w342"))
          .filter((url): url is string => url !== null),
      });
      return { card, version: recapVersion(recap) };
    }
    case "movie":
    case "serial": {
      const tmdbId = Number(id);
      const media = kind === "movie"
        ? await PublicShareReadService.getFilm(tmdbId, { withRating: true })
        : await PublicShareReadService.getSeries(tmdbId, { withRating: true });
      if (!media) return null;
      const card = await renderMediaCard({
        ...media,
        posterUrl: tmdbImageUrl(media.posterPath, "w342"),
        backdropUrl: tmdbImageUrl(media.backdropPath, "w780"),
      });
      return { card, version: null };
    }
  }
};

const remember = (key: string, value: VersionedCard) => {
  // A card missing artwork is served once and re-rendered next time.
  if (!value.card.complete) return;
  if (cache.size >= CARD_CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { ...value, expiresAt: Date.now() + CARD_TTL_MS });
};

export class PublicCardService {
  // Null when the content isn't public; throws when rendering fails or times out.
  static async render(kind: ShareCardKind, id: string, requestedVersion?: string): Promise<ShareCard | null> {
    const key = `${kind}:${id}`;
    const hit = cache.get(key);
    if (hit && hit.expiresAt > Date.now() && (!requestedVersion || hit.version === requestedVersion)) {
      return hit.card;
    }
    cache.delete(key);

    let pending = inFlight.get(key);
    if (!pending) {
      pending = withTimeout(loadAndRender(kind, id), RENDER_TIMEOUT_MS).finally(() => inFlight.delete(key));
      inFlight.set(key, pending);
    }

    const result = await pending;
    if (!result) return null;
    remember(key, result);
    return result.card;
  }
}
