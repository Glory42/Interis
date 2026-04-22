import { z } from "zod";
import { apiRequest } from "@/lib/api-client";

const followStateSchema = z.object({
  isFollowing: z.boolean(),
});

const followActionResponseSchema = z.object({
  success: z.boolean(),
});

const followUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayUsername: z.string().nullish(),
  image: z.string().nullish(),
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
