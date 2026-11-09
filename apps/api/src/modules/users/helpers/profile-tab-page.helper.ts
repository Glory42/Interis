import { BadRequestError } from "../../../commons/errors/app-error";
import { parseIntParam } from "../../../commons/helpers/parse-int-param.helper";

// Merged Film+Series tabs read offset+limit rows from each table, so a huge
// offset would pull a whole collection to return one page.
export const MAX_PROFILE_TAB_OFFSET = 5_000;

// "app" is the in-app Profile (/api/users), "widget" the external widget API (/api/public).
export type ProfileTabSurface = "app" | "widget";

export type ProfileTabPageRule = {
  defaultLimit: number;
  maxLimit: number;
  acceptsOffset: boolean;
};

export type ProfileTabPage = { limit: number; offset: number };

// A missing or invalid limit gets the default and a big one is clamped. Past the offset cap
// the app gets a 400, while widgets keep their original clamp.
export const normalizeProfileTabPage = (
  query: Record<string, unknown>,
  rule: ProfileTabPageRule,
  surface: ProfileTabSurface,
): ProfileTabPage => {
  const limit = parseIntParam(query.limit, rule.defaultLimit, rule.maxLimit);
  if (!rule.acceptsOffset) {
    return { limit, offset: 0 };
  }

  const offset = parseIntParam(query.offset, 0);
  if (offset <= MAX_PROFILE_TAB_OFFSET) {
    return { limit, offset };
  }
  if (surface === "widget") {
    return { limit, offset: MAX_PROFILE_TAB_OFFSET };
  }
  throw new BadRequestError(`offset must be at most ${MAX_PROFILE_TAB_OFFSET}`);
};
