import type { RequestHandler } from "express";
import { classifyClient } from "../http/crawler-detection.helper";
import { sendForbidden } from "../http/validation-response.helper";

// Endpoints that never touch the DB, plus the widget API that is meant for automated callers.
const OPEN_PATH_PATTERN = /^\/(?:robots\.txt$|api\/health$|api\/public\/)/;

// Public profile endpoints (/api/users/:username/**) stay crawlable so profiles remain indexable.
const CRAWLABLE_PATH_PATTERN = /^\/api\/users\/(?!me(?:\/|$)|stats\/)[^/]+(?:\/|$)/;

// Each request reaching Neon keeps its compute awake 5 min; in 2026-11 Googlebot plus an AWS
// scraper kept it awake ~82% of the time, on pace to exceed the Free plan's 100 CU-h/month.
export const blockCrawlers: RequestHandler = (req, res, next) => {
  if (OPEN_PATH_PATTERN.test(req.path)) {
    next();
    return;
  }

  const kind = classifyClient(req.headers);
  const isBlocked =
    kind === "spoofed-browser" || (kind === "crawler" && !CRAWLABLE_PATH_PATTERN.test(req.path));

  if (isBlocked) {
    sendForbidden(res, "Automated access is not allowed");
    return;
  }

  next();
};
