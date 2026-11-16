import { Router } from "express";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "../../commons/utils/asyncHandler";
import { env } from "../../infrastructure/config/env";
import { createPublicResponseCache } from "./helpers/public-response-cache.helper";
import { PublicShareController } from "./public-share.controller";

// Link-preview meta (/api/public/meta/*) and share cards (/api/public/og/*.png), read by
// the web app's Pages Function and by link-preview bots. Mounted before the widget router.
export const createPublicShareRouter = (): Router => {
  const router = Router();
  const limiter = rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false });

  const meta = Router();
  meta.use(limiter);
  // Same in-process response cache as the widget API (off under test, see public.routes.ts).
  meta.use(createPublicResponseCache({ ttlMs: env.NODE_ENV === "test" ? 0 : 5 * 60 * 1000, maxEntries: 500 }));
  meta.get("/review/:username/:reviewId", asyncHandler(PublicShareController.reviewMeta));
  meta.get("/profile/:username", asyncHandler(PublicShareController.profileMeta));
  meta.get("/list/:listId", asyncHandler(PublicShareController.listMeta));
  meta.get("/movie/:tmdbId", asyncHandler(PublicShareController.filmMeta));
  meta.get("/serial/:tmdbId", asyncHandler(PublicShareController.seriesMeta));
  meta.get("/serial/:tmdbId/season/:seasonNumber", asyncHandler(PublicShareController.seriesMeta));
  meta.get("/person/:role/:slug", asyncHandler(PublicShareController.personMeta));

  const og = Router();
  og.use(limiter);
  og.get("/review/:id.png", asyncHandler(PublicShareController.card("review")));
  og.get("/list/:id.png", asyncHandler(PublicShareController.card("list")));
  og.get("/profile/:id.png", asyncHandler(PublicShareController.card("profile")));
  og.get("/movie/:id.png", asyncHandler(PublicShareController.card("movie")));
  og.get("/serial/:id.png", asyncHandler(PublicShareController.card("serial")));

  router.use("/meta", meta);
  router.use("/og", og);
  return router;
};
