import { z } from "zod";
import { apiRequest, encodeSegment } from "./client";
import { followUserSchema, type FollowUser } from "@/types/profile";

export const getIsFollowing = async (username: string): Promise<boolean> => {
  const response = await apiRequest<unknown>(`/api/social/is-following/${encodeSegment(username)}`);
  return z.object({ isFollowing: z.boolean() }).parse(response).isFollowing;
};

export const followUser = async (username: string): Promise<void> => {
  await apiRequest<unknown>(`/api/social/follow/${encodeSegment(username)}`, { method: "POST" });
};

export const unfollowUser = async (username: string): Promise<void> => {
  await apiRequest<unknown>(`/api/social/follow/${encodeSegment(username)}`, { method: "DELETE" });
};

export const getFollowers = async (username: string): Promise<FollowUser[]> => {
  const response = await apiRequest<unknown>(`/api/social/followers/${encodeSegment(username)}`);
  return z.array(followUserSchema).parse(response);
};

export const getFollowing = async (username: string): Promise<FollowUser[]> => {
  const response = await apiRequest<unknown>(`/api/social/following/${encodeSegment(username)}`);
  return z.array(followUserSchema).parse(response);
};
