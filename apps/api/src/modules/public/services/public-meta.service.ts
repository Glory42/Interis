import { SHARE_CARD_EXTENSION } from "../../../infrastructure/share-cards";
import { tmdbImageUrl } from "../../../infrastructure/tmdb/tmdb-images.helper";
import { recapShareText, recapVersion } from "../helpers/recap-share.helper";
import {
  listShareText,
  mediaShareText,
  personShareText,
  profileShareText,
  reviewShareText,
  seasonLabel,
} from "../helpers/share-meta-format.helper";
import type { ShareMeta } from "../dto/public-share.dto";
import { PublicShareReadService } from "./public-share-read.service";

// `id` may span segments (a recap's "<username>/<year>"); each one is encoded.
const cardPath = (kind: string, id: string | number, version?: string) => {
  const encodedId = String(id).split("/").map(encodeURIComponent).join("/");
  return `/api/public/og/${kind}/${encodedId}.${SHARE_CARD_EXTENSION}${version ? `?v=${version}` : ""}`;
};

// Link-preview meta per shareable page. `path` is relative to the web app's origin and a
// relative `image` to the API's, so neither depends on which host served the request.
export class PublicMetaService {
  static async review(username: string, reviewId: string): Promise<ShareMeta | null> {
    const review = await PublicShareReadService.getReview(reviewId);
    if (!review || review.authorUsername !== username) return null;
    return {
      kind: "review",
      ogType: "article",
      ...reviewShareText(review),
      image: cardPath("review", review.id, review.version),
      path: `/reviews/${encodeURIComponent(username)}/${review.id}`,
    };
  }

  static async profile(username: string): Promise<ShareMeta | null> {
    const profile = await PublicShareReadService.getProfile(username);
    if (!profile) return null;
    return {
      kind: "profile",
      ogType: "profile",
      ...profileShareText(profile),
      image: cardPath("profile", profile.username),
      path: `/profile/${encodeURIComponent(profile.username)}`,
    };
  }

  static async list(listId: string): Promise<ShareMeta | null> {
    const list = await PublicShareReadService.getList(listId);
    if (!list) return null;
    return {
      kind: "list",
      ogType: "website",
      // By username, as the in-app List page (and its <head>) names the owner.
      ...listShareText({ ...list, ownerName: list.ownerUsername }),
      image: cardPath("list", list.id, list.version),
      path: `/profile/${encodeURIComponent(list.ownerUsername)}/lists/${list.id}`,
    };
  }

  static async recap(username: string, year: number): Promise<ShareMeta | null> {
    const recap = await PublicShareReadService.getYearReview(username, year);
    if (!recap) return null;
    return {
      kind: "recap",
      ogType: "website",
      ...recapShareText(recap),
      image: cardPath("recap", `${recap.user.username}/${year}`, recapVersion(recap)),
      path: `/recap/${encodeURIComponent(recap.user.username)}/${year}`,
    };
  }

  static async film(tmdbId: number): Promise<ShareMeta | null> {
    const film = await PublicShareReadService.getFilm(tmdbId, { withRating: false });
    if (!film) return null;
    return {
      kind: "film",
      ogType: "video.movie",
      ...mediaShareText(film),
      image: cardPath("movie", tmdbId),
      path: `/movies/${tmdbId}`,
    };
  }

  static async series(tmdbId: number, seasonNumber?: number): Promise<ShareMeta | null> {
    const series = await PublicShareReadService.getSeries(tmdbId, { withRating: false });
    if (!series) return null;
    const text = mediaShareText(series);
    if (seasonNumber === undefined) {
      return { kind: "series", ogType: "video.tv_show", ...text, image: cardPath("serial", tmdbId), path: `/serials/${tmdbId}` };
    }

    if (series.numberOfSeasons !== null && seasonNumber > series.numberOfSeasons) return null;
    return {
      kind: "season",
      ogType: "video.tv_show",
      title: `${series.title} · ${seasonLabel(seasonNumber)}`,
      description: text.description,
      image: cardPath("serial", tmdbId),
      path: `/serials/${tmdbId}/season/${seasonNumber}`,
    };
  }

  static async person(role: "actor" | "director", slug: string): Promise<ShareMeta | null> {
    const person = await PublicShareReadService.getPerson(slug);
    if (!person) return null;
    return {
      kind: "person",
      ogType: "profile",
      ...personShareText({ name: person.name, role }),
      image: tmdbImageUrl(person.profilePath, "h632"),
      path: `/${role}/${encodeURIComponent(person.slug)}`,
    };
  }
}
