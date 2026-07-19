import type { Context, MiddlewareHandler, Next } from "hono";
import {
  getOriginFromReferer,
  isTrustedOrigin,
} from "../../infrastructure/config/origins";
import { sendForbidden } from "../http/validation-response.hono";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export const requireTrustedOriginForMutations = (
  trustedOrigins: string[],
): MiddlewareHandler => {
  return async (c: Context, next: Next) => {
    if (SAFE_METHODS.has(c.req.method)) {
      await next();
      return;
    }

    if (!c.req.path.startsWith("/api/")) {
      await next();
      return;
    }

    const originHeader = c.req.header("origin");
    const refererHeader = c.req.header("referer");

    const origin = originHeader ?? (refererHeader ? getOriginFromReferer(refererHeader) : null);

    if (!origin) {
      await next();
      return;
    }

    if (!isTrustedOrigin(origin, trustedOrigins)) {
      return sendForbidden(c, "Invalid origin");
    }

    await next();
  };
};
