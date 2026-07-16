import type { Request, Response, NextFunction } from "express";
import { resolveSessionFromHeaders } from "../auth/session-resolver.helper";
import { sendUnauthorized } from "../http/validation-response.helper";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const session = await resolveSessionFromHeaders(req.headers);

  if (!session) {
    sendUnauthorized(res);
    return;
  }

  req.user = session.user;
  req.session = session.session;
  next();
};
