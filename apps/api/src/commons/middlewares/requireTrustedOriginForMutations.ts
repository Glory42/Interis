import type { RequestHandler } from "express";
import {
  getOriginFromReferer,
  isTrustedOrigin,
} from "../../infrastructure/config/origins";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export const requireTrustedOriginForMutations = (
  trustedOrigins: string[],
): RequestHandler => {
  return (req, res, next) => {
    if (SAFE_METHODS.has(req.method)) {
      next();
      return;
    }

    if (!req.path.startsWith("/api/")) {
      next();
      return;
    }

    const originHeader = req.headers.origin;
    const refererHeader = req.headers.referer;

    const origin =
      typeof originHeader === "string"
        ? originHeader
        : typeof refererHeader === "string"
          ? getOriginFromReferer(refererHeader)
          : null;

    if (!origin) {
      next();
      return;
    }

    if (!isTrustedOrigin(origin, trustedOrigins)) {
      res.status(403).json({ error: "Invalid origin" });
      return;
    }

    next();
  };
};
