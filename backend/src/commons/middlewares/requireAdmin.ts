import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db } from "../../infrastructure/database/db";
import { profiles } from "../../modules/users/users.entity";

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const [profile] = await db
    .select({ isAdmin: profiles.isAdmin })
    .from(profiles)
    .where(eq(profiles.userId, req.user.id))
    .limit(1);

  if (!profile || !profile.isAdmin) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  next();
};
