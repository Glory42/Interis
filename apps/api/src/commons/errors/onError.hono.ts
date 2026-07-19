import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { AppError } from "./app-error";
import { logger } from "../utils/logger";

// CORS-rejection and body-too-large responses return directly from their own
// middlewares (cors.hono.ts / bodyLimit.hono.ts), so this only needs AppError,
// malformed JSON, and a generic 500 fallback.
export const onError = (err: Error, c: Context): Response => {
  if (err instanceof AppError) {
    return c.json(
      { error: { message: err.message, code: err.code, details: err.details } },
      err.statusCode as ContentfulStatusCode,
    );
  }

  if (err instanceof SyntaxError) {
    return c.json({ error: { message: "Malformed request body", code: "MALFORMED_BODY" } }, 400);
  }

  logger.error(err);
  return c.json({ error: { message: "Internal server error", code: "INTERNAL_SERVER_ERROR" } }, 500);
};
