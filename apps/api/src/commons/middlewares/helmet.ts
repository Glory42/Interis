import helmet from "helmet";

/**
 * Interis's API is pure JSON with no server-rendered HTML/JS/assets, so the
 * CSP can be maximally restrictive — nothing this API returns is ever meant
 * to be loaded as a document, script, or embedded frame.
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'none'"],
    },
  },
  frameguard: { action: "deny" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
});
