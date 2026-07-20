import type { Request, Response, NextFunction } from "express";
import { sendForbidden } from "../http/validation-response.helper";

// Must run after requireAuth — reads the isAdmin flag it already resolved
// via the single profiles lookup, rather than querying again.
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.session.isAdmin) {
    sendForbidden(res);
    return;
  }

  next();
};
