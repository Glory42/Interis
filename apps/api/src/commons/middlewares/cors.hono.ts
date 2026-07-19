import { cors } from "hono/cors";
import type { MiddlewareHandler } from "hono";
import { isTrustedOrigin } from "../../infrastructure/config/origins";

export const publicCorsMiddleware: MiddlewareHandler = cors({
  origin: "*",
  allowMethods: ["GET", "HEAD", "OPTIONS"],
  credentials: false,
});

// hono/cors just omits Access-Control-Allow-Origin for a rejected origin
// (browser-side block only); this app needs an explicit 403 with a
// CORS_NOT_ALLOWED body (see tests/integration/security/cors-csrf.test.ts),
// so untrusted origins are rejected up front before hono/cors runs.
export const createTrustedOriginCorsMiddleware = (
  trustedOrigins: string[],
): MiddlewareHandler[] => {
  const rejectUntrustedOrigin: MiddlewareHandler = async (c, next) => {
    const origin = c.req.header("origin");

    if (origin && !isTrustedOrigin(origin, trustedOrigins)) {
      return c.json(
        { error: { message: "Origin is not allowed", code: "CORS_NOT_ALLOWED" } },
        403,
      );
    }

    await next();
  };

  return [
    rejectUntrustedOrigin,
    cors({
      origin: (origin) => (origin ? origin : undefined),
      credentials: true,
    }),
  ];
};
