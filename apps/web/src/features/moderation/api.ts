import { z } from "zod";
import { apiRequest } from "@/lib/api-client";
import { successResponseSchema, userSummarySchema } from "@/types/api";

const relationshipStateSchema = z.object({
  isBlocked: z.boolean(),
  isMuted: z.boolean(),
});

const moderationActionResponseSchema = successResponseSchema;

const moderatedUserSchema = userSummarySchema.extend({
  displayUsername: z.string().nullish(),
  avatarUrl: z.string().nullish(),
  createdAt: z.coerce.date(),
});

export type RelationshipState = z.infer<typeof relationshipStateSchema>;
export type ModerationActionResponse = z.infer<typeof moderationActionResponseSchema>;
export type ModeratedUser = z.infer<typeof moderatedUserSchema>;

export const getRelationshipState = async (username: string): Promise<RelationshipState> => {
  const response = await apiRequest<unknown>(
    `/api/moderation/state/${encodeURIComponent(username)}`,
    { method: "GET" },
  );
  return relationshipStateSchema.parse(response);
};

export const blockUser = async (username: string): Promise<ModerationActionResponse> => {
  const response = await apiRequest<unknown>(
    `/api/moderation/block/${encodeURIComponent(username)}`,
    { method: "POST" },
  );
  return moderationActionResponseSchema.parse(response);
};

export const unblockUser = async (username: string): Promise<ModerationActionResponse> => {
  const response = await apiRequest<unknown>(
    `/api/moderation/block/${encodeURIComponent(username)}`,
    { method: "DELETE" },
  );
  return moderationActionResponseSchema.parse(response);
};

export const muteUser = async (username: string): Promise<ModerationActionResponse> => {
  const response = await apiRequest<unknown>(
    `/api/moderation/mute/${encodeURIComponent(username)}`,
    { method: "POST" },
  );
  return moderationActionResponseSchema.parse(response);
};

export const unmuteUser = async (username: string): Promise<ModerationActionResponse> => {
  const response = await apiRequest<unknown>(
    `/api/moderation/mute/${encodeURIComponent(username)}`,
    { method: "DELETE" },
  );
  return moderationActionResponseSchema.parse(response);
};

export const getBlockedUsers = async (): Promise<ModeratedUser[]> => {
  const response = await apiRequest<unknown>("/api/moderation/blocked", { method: "GET" });
  return z.array(moderatedUserSchema).parse(response);
};

export const getMutedUsers = async (): Promise<ModeratedUser[]> => {
  const response = await apiRequest<unknown>("/api/moderation/muted", { method: "GET" });
  return z.array(moderatedUserSchema).parse(response);
};
