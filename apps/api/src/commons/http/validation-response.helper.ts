import type { Response } from "express";
import { z, type ZodError } from "zod";
import type { ErrorCode } from "../errors/app-error";

type ErrorPayload = { message: string; code: ErrorCode; details?: unknown };

const sendError = (res: Response, status: number, payload: ErrorPayload): void => {
  res.status(status).json({ error: payload });
};

export const sendBadRequest = (res: Response, message: string, details?: unknown): void =>
  sendError(res, 400, { message, code: "BAD_REQUEST", details });

export const sendValidationError = (res: Response, error: ZodError): void =>
  sendError(res, 400, {
    message: "Validation failed",
    code: "VALIDATION_ERROR",
    details: z.flattenError(error),
  });

export const sendUnauthorized = (res: Response, message = "Unauthorized"): void =>
  sendError(res, 401, { message, code: "UNAUTHORIZED" });

export const sendForbidden = (res: Response, message = "Forbidden"): void =>
  sendError(res, 403, { message, code: "FORBIDDEN" });

export const sendNotFound = (res: Response, message: string): void =>
  sendError(res, 404, { message, code: "NOT_FOUND" });

// Runs `lookup`, sending a 404 (and returning null) if it resolves to a
// nullish value — collapses the repeated "fetch by param or 404" block
// found at the top of many controller handlers into one call.
export const resolveOrNotFound = async <T>(
  res: Response,
  message: string,
  lookup: () => Promise<T | null | undefined>,
): Promise<T | null> => {
  const result = await lookup();
  if (!result) {
    sendNotFound(res, message);
    return null;
  }

  return result;
};

export const sendConflict = (res: Response, message: string, details?: unknown): void =>
  sendError(res, 409, { message, code: "CONFLICT", details });

export const sendServiceUnavailable = (res: Response, message: string): void =>
  sendError(res, 503, { message, code: "SERVICE_UNAVAILABLE" });

const CODE_BY_STATUS: Partial<Record<number, ErrorCode>> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  503: "SERVICE_UNAVAILABLE",
};

// For service-layer `{ status, error }` results where the status is only
// known at the call site (not baked into a specific send* helper above).
export const sendErrorForStatus = (res: Response, status: number, message: string): void =>
  sendError(res, status, { message, code: CODE_BY_STATUS[status] ?? "BAD_REQUEST" });
