import { z } from "zod";
import { apiRequest, type QueryRequestOptions } from "@/lib/api-client";
import { successResponseSchema, userSummarySchema } from "@/types/api";

const followStateSchema = z.object({
  isFollowing: z.boolean(),
});

const followActionResponseSchema = successResponseSchema;

const followUserSchema = userSummarySchema.extend({
  displayUsername: z.string().nullish(),
  avatarUrl: z.string().nullish(),
});

export type FollowState = z.infer<typeof followStateSchema>;
export type FollowActionResponse = z.infer<typeof followActionResponseSchema>;
export type FollowUser = z.infer<typeof followUserSchema>;

export const getIsFollowing = async (username: string): Promise<FollowState> => {
  const response = await apiRequest<unknown>(
    `/api/social/is-following/${encodeURIComponent(username)}`,
    {
      method: "GET",
    },
  );

  return followStateSchema.parse(response);
};

export const followUser = async (username: string): Promise<FollowActionResponse> => {
  const response = await apiRequest<unknown>(
    `/api/social/follow/${encodeURIComponent(username)}`,
    {
      method: "POST",
    },
  );

  return followActionResponseSchema.parse(response);
};

export const unfollowUser = async (username: string): Promise<FollowActionResponse> => {
  const response = await apiRequest<unknown>(
    `/api/social/follow/${encodeURIComponent(username)}`,
    {
      method: "DELETE",
    },
  );

  return followActionResponseSchema.parse(response);
};

export const getFollowers = async (username: string): Promise<FollowUser[]> => {
  const response = await apiRequest<unknown>(
    `/api/social/followers/${encodeURIComponent(username)}`,
    { method: "GET" },
  );
  return z.array(followUserSchema).parse(response);
};

export const getFollowing = async (username: string): Promise<FollowUser[]> => {
  const response = await apiRequest<unknown>(
    `/api/social/following/${encodeURIComponent(username)}`,
    { method: "GET" },
  );
  return z.array(followUserSchema).parse(response);
};

export const removeFollower = async (username: string): Promise<FollowActionResponse> => {
  const response = await apiRequest<unknown>(
    `/api/social/follower/${encodeURIComponent(username)}`,
    { method: "DELETE" },
  );
  return followActionResponseSchema.parse(response);
};

// The API caps one lookup at 60 user ids.
export const VIEWER_FOLLOWS_MAX_IDS = 60;

// Which of `userIdsParam` (comma-separated ids) the signed-in viewer follows.
export const getViewerFollows = async (
  userIdsParam: string,
  options: QueryRequestOptions = {},
): Promise<string[]> => {
  const response = await apiRequest<unknown>(
    `/api/social/following-status?userIds=${encodeURIComponent(userIdsParam)}`,
    { method: "GET", signal: options.signal },
  );
  return z.object({ followingIds: z.array(z.string()) }).parse(response).followingIds;
};
