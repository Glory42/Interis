import type { Context, Next } from "hono";
import { eq } from "drizzle-orm";
import type { AppEnv } from "../../infrastructure/http/hono-context.types";
import { db } from "../../infrastructure/database/db";
import { profiles } from "../../modules/users/users.entity";
import { sendForbidden } from "../http/validation-response.hono";

export const requireAdmin = async (c: Context<AppEnv>, next: Next): Promise<Response | void> => {
  const [profile] = await db
    .select({ isAdmin: profiles.isAdmin })
    .from(profiles)
    .where(eq(profiles.userId, c.get("user").id))
    .limit(1);

  if (!profile || !profile.isAdmin) {
    return sendForbidden(c);
  }

  await next();
};
