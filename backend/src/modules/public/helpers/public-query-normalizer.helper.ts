import {
  DEFAULT_PUBLIC_RECENT_LIMIT,
  MAX_CONTRIBUTION_WINDOW_DAYS,
  MAX_PUBLIC_RECENT_LIMIT,
  MIN_CONTRIBUTION_WINDOW_DAYS,
} from "../constants/public-contributions.constants";

export const normalizeContributionWindowDays = (
  rawDays: unknown,
): number | undefined => {
  if (typeof rawDays !== "string") {
    return undefined;
  }

  const parsed = Number.parseInt(rawDays, 10);
  if (Number.isNaN(parsed)) {
    return undefined;
  }

  return Math.max(
    MIN_CONTRIBUTION_WINDOW_DAYS,
    Math.min(MAX_CONTRIBUTION_WINDOW_DAYS, parsed),
  );
};

export const normalizePublicRecentLimit = (rawLimit: unknown): number => {
  const parsed = Number(rawLimit);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return DEFAULT_PUBLIC_RECENT_LIMIT;
  }

  return Math.min(MAX_PUBLIC_RECENT_LIMIT, parsed);
};
