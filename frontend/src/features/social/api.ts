import { z } from "zod";
import { apiRequest } from "@/lib/api-client";

const followStateSchema = z.object({
  isFollowing: z.boolean(),
});

const followActionResponseSchema = z.object({
  success: z.boolean(),
});

export type FollowState = z.infer<typeof followStateSchema>;
export type FollowActionResponse = z.infer<typeof followActionResponseSchema>;

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
