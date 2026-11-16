import { z } from "zod";
import { apiRequest } from "@/lib/api-client";

const pushConfigSchema = z.object({
  enabled: z.boolean(),
  publicKey: z.string().nullable(),
});

const pushPreferencesSchema = z.object({
  follows: z.boolean(),
  likes: z.boolean(),
  comments: z.boolean(),
  moderation: z.boolean(),
});

export type PushConfig = z.infer<typeof pushConfigSchema>;
export type PushPreferences = z.infer<typeof pushPreferencesSchema>;
export type PushCategory = keyof PushPreferences;

export const getPushConfig = async (): Promise<PushConfig> => {
  const response = await apiRequest<unknown>("/api/push/public-key", { method: "GET" });
  return pushConfigSchema.parse(response);
};

export const saveDeviceSubscription = async (subscription: PushSubscriptionJSON): Promise<void> => {
  await apiRequest("/api/push/subscriptions", { method: "POST", body: subscription });
};

export const removeDeviceSubscription = async (endpoint: string): Promise<void> => {
  await apiRequest("/api/push/subscriptions", { method: "DELETE", body: { endpoint } });
};

export const getPushPreferences = async (): Promise<PushPreferences> => {
  const response = await apiRequest<unknown>("/api/push/preferences", { method: "GET" });
  return pushPreferencesSchema.parse(response);
};

export const updatePushPreferences = async (
  changes: Partial<PushPreferences>,
): Promise<PushPreferences> => {
  const response = await apiRequest<unknown, Partial<PushPreferences>>("/api/push/preferences", {
    method: "PUT",
    body: changes,
  });
  return pushPreferencesSchema.parse(response);
};
