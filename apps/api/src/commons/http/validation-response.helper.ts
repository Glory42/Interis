import type { Response } from "express";
import { z, type ZodError } from "zod";

export const sendBadRequest = (res: Response, message: string): void => {
  res.status(400).json({ error: message });
};

export const sendValidationError = (
  res: Response,
  error: ZodError,
): void => {
  res.status(400).json({ error: z.flattenError(error) });
};
