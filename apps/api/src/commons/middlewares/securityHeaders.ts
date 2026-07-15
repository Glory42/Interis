import type { RequestHandler } from "express";

const permissionsPolicy = [
  "camera=()",
  "microphone=()",
  "geolocation=()",
  "payment=()",
].join(", ");

/**
 * Sets Permissions-Policy — the one baseline security header Helmet does not
 * set. All other headers (CSP, X-Frame-Options, HSTS, etc.) come from Helmet.
 */
export const securityHeaders: RequestHandler = (_req, res, next) => {
  res.setHeader("Permissions-Policy", permissionsPolicy);
  next();
};
