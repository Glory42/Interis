import { randomUUID } from "node:crypto";
import type { MiddlewareHandler } from "hono";
import { logger } from "../utils/logger";

// pino-http is Express-only glue around pino (which isn't) — no Hono
// equivalent package exists.
export const requestLoggerMiddleware: MiddlewareHandler = async (c, next) => {
  const startedAt = Date.now();
  const incomingRequestId = c.req.header("x-request-id");
  const requestId =
    incomingRequestId && incomingRequestId.length > 0 ? incomingRequestId : randomUUID();

  await next();

  c.res.headers.set("x-request-id", requestId);

  logger.info(
    {
      req: {
        id: requestId,
        method: c.req.method,
        url: c.req.path,
      },
      res: {
        statusCode: c.res.status,
      },
      responseTime: Date.now() - startedAt,
    },
    "request completed",
  );
};
