import { bodyLimit } from "hono/body-limit";
import type { Context, MiddlewareHandler } from "hono";

const tooLarge = (c: Context): Response =>
  c.json({ error: { message: "Request body too large", code: "PAYLOAD_TOO_LARGE" } }, 413);

export const createBodyLimitMiddleware = (maxSize: number): MiddlewareHandler =>
  bodyLimit({ maxSize, onError: tooLarge });

export const defaultBodyLimitMiddleware: MiddlewareHandler = createBodyLimitMiddleware(
  1024 * 1024,
);
