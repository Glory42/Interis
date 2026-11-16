import type { Request, Response } from "express";
import { sendNotFound } from "../../commons/http/validation-response.helper";
import { logger } from "../../commons/utils/logger";
import { getTrustedOriginsFromEnv } from "../../infrastructure/config/origins";
import {
  sharePersonRoleSchema,
  shareSeasonNumberSchema,
  shareTmdbIdSchema,
  type ShareMeta,
} from "./dto/public-share.dto";
import { PublicMetaService } from "./services/public-meta.service";
import { PublicCardService, type ShareCardKind } from "./services/public-card.service";

// Cloudflare (s-maxage) holds meta for an hour; bots and browsers re-check after 5 min.
const META_CACHE_CONTROL = "public, max-age=300, s-maxage=3600";
const NOT_FOUND_CACHE_CONTROL = "public, max-age=60, s-maxage=300";
// Review and List card URLs carry a content version, so edits never wait these out.
const CARD_CACHE_CONTROL = "public, max-age=3600, s-maxage=21600";
const INCOMPLETE_CARD_CACHE_CONTROL = "public, max-age=60, s-maxage=60";

const sendMeta = (res: Response, meta: ShareMeta | null): void => {
  if (!meta) {
    res.setHeader("Cache-Control", NOT_FOUND_CACHE_CONTROL);
    sendNotFound(res, "Not found");
    return;
  }
  res.setHeader("Cache-Control", META_CACHE_CONTROL);
  res.status(200).json(meta);
};

const parseOrNull = <T>(schema: { safeParse: (value: unknown) => { success: boolean; data?: T } }, value: unknown) => {
  const parsed = schema.safeParse(value);
  return parsed.success ? (parsed.data as T) : null;
};

const isValidCardId = (kind: ShareCardKind, id: string) =>
  kind === "movie" || kind === "serial" ? parseOrNull<number>(shareTmdbIdSchema, id) !== null : id.length > 0 && id.length <= 64;

export class PublicShareController {
  // GET /api/public/meta/review/:username/:reviewId
  static async reviewMeta(req: Request<{ username: string; reviewId: string }>, res: Response) {
    sendMeta(res, await PublicMetaService.review(req.params.username, req.params.reviewId));
  }

  // GET /api/public/meta/profile/:username
  static async profileMeta(req: Request<{ username: string }>, res: Response) {
    sendMeta(res, await PublicMetaService.profile(req.params.username));
  }

  // GET /api/public/meta/list/:listId
  static async listMeta(req: Request<{ listId: string }>, res: Response) {
    sendMeta(res, await PublicMetaService.list(req.params.listId));
  }

  // GET /api/public/meta/movie/:tmdbId
  static async filmMeta(req: Request<{ tmdbId: string }>, res: Response) {
    const tmdbId = parseOrNull<number>(shareTmdbIdSchema, req.params.tmdbId);
    sendMeta(res, tmdbId === null ? null : await PublicMetaService.film(tmdbId));
  }

  // GET /api/public/meta/serial/:tmdbId and /api/public/meta/serial/:tmdbId/season/:seasonNumber
  static async seriesMeta(req: Request<{ tmdbId: string; seasonNumber?: string }>, res: Response) {
    const tmdbId = parseOrNull<number>(shareTmdbIdSchema, req.params.tmdbId);
    const hasSeason = req.params.seasonNumber !== undefined;
    const seasonNumber = hasSeason ? parseOrNull<number>(shareSeasonNumberSchema, req.params.seasonNumber) : undefined;
    if (tmdbId === null || seasonNumber === null) {
      sendMeta(res, null);
      return;
    }
    sendMeta(res, await PublicMetaService.series(tmdbId, seasonNumber));
  }

  // GET /api/public/meta/person/:role/:slug
  static async personMeta(req: Request<{ role: string; slug: string }>, res: Response) {
    const role = parseOrNull<"actor" | "director">(sharePersonRoleSchema, req.params.role);
    const slug = req.params.slug.trim().toLowerCase();
    sendMeta(res, role === null || !/^[a-z0-9-]{1,200}$/.test(slug) ? null : await PublicMetaService.person(role, slug));
  }

  // GET /api/public/og/:kind/:id.png — falls back to the static /og-image.png when rendering fails.
  static card(kind: ShareCardKind) {
    return async (req: Request<{ id: string }>, res: Response): Promise<void> => {
      const { id } = req.params;
      if (!isValidCardId(kind, id)) {
        res.setHeader("Cache-Control", NOT_FOUND_CACHE_CONTROL);
        sendNotFound(res, "Not found");
        return;
      }

      const version = typeof req.query.v === "string" ? req.query.v.slice(0, 16) : undefined;
      try {
        const card = await PublicCardService.render(kind, id, version);
        if (!card) {
          res.setHeader("Cache-Control", NOT_FOUND_CACHE_CONTROL);
          sendNotFound(res, "Not found");
          return;
        }
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Cache-Control", card.complete ? CARD_CACHE_CONTROL : INCOMPLETE_CARD_CACHE_CONTROL);
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        res.status(200).send(card.png);
      } catch (error) {
        logger.warn({ err: error, kind, id }, "share card render failed");
        res.setHeader("Cache-Control", "public, max-age=60");
        res.redirect(302, `${getTrustedOriginsFromEnv()[0]}/og-image.png`);
      }
    };
  }
}
