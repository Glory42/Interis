import { z } from "zod";

export type FeedQueryDto = {
  limit?: string;
  cursor?: string;
  mediaType?: string;
  // The viewer's IANA time zone, e.g. "Europe/Istanbul".
  tz?: string;
};

export type UsernameParamsDto = {
  username: string;
};

export const FOLLOWING_STATUS_MAX_IDS = 60;

const userIdPattern = /^[A-Za-z0-9_-]{1,64}$/;

// `userIds=a,b,c` — up to 60 user ids, duplicates dropped.
export const FollowingStatusQuerySchema = z.object({
  userIds: z
    .string()
    .trim()
    .min(1)
    .transform((raw) => raw.split(",").map((id) => id.trim()))
    .pipe(z.array(z.string().regex(userIdPattern)).max(FOLLOWING_STATUS_MAX_IDS))
    .transform((ids) => [...new Set(ids)]),
});
