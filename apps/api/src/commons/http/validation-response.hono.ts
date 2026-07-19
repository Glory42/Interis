import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { z, type ZodError } from "zod";
import type { ErrorCode } from "../errors/app-error";

type ErrorPayload = { message: string; code: ErrorCode; details?: unknown };

const sendError = (c: Context, status: number, payload: ErrorPayload): Response =>
  c.json({ error: payload }, status as ContentfulStatusCode);

export const sendBadRequest = (c: Context, message: string, details?: unknown): Response =>
  sendError(c, 400, { message, code: "BAD_REQUEST", details });

export const sendValidationError = (c: Context, error: ZodError): Response =>
  sendError(c, 400, {
    message: "Validation failed",
    code: "VALIDATION_ERROR",
    details: z.flattenError(error),
  });

export const sendUnauthorized = (c: Context, message = "Unauthorized"): Response =>
  sendError(c, 401, { message, code: "UNAUTHORIZED" });

export const sendForbidden = (c: Context, message = "Forbidden"): Response =>
  sendError(c, 403, { message, code: "FORBIDDEN" });

export const sendNotFound = (c: Context, message: string): Response =>
  sendError(c, 404, { message, code: "NOT_FOUND" });

export const sendConflict = (c: Context, message: string, details?: unknown): Response =>
  sendError(c, 409, { message, code: "CONFLICT", details });

export const sendServiceUnavailable = (c: Context, message: string): Response =>
  sendError(c, 503, { message, code: "SERVICE_UNAVAILABLE" });

const CODE_BY_STATUS: Partial<Record<number, ErrorCode>> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
};

// For service-layer `{ status, error }` results where the status is only
// known at the call site (not baked into a specific send* helper above).
export const sendErrorForStatus = (c: Context, status: number, message: string): Response =>
  sendError(c, status, { message, code: CODE_BY_STATUS[status] ?? "BAD_REQUEST" });
