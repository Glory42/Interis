import { bodyLimit } from "hono/body-limit";
import type { Context, MiddlewareHandler } from "hono";

const tooLarge = (c: Context): Response =>
  c.json({ error: { message: "Request body too large", code: "PAYLOAD_TOO_LARGE" } }, 413);

export const authBodyLimitMiddleware: MiddlewareHandler = bodyLimit({
  maxSize: 20 * 1024,
  onError: tooLarge,
});

export const defaultBodyLimitMiddleware: MiddlewareHandler = bodyLimit({
  maxSize: 1024 * 1024,
  onError: tooLarge,
});
