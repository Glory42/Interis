import type { Request, Response, NextFunction } from "express";
import { resolveSessionFromHeaders } from "../auth/session-resolver.helper";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const session = await resolveSessionFromHeaders(req.headers);

  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.user = session.user;
  req.session = session.session;
  next();
};
