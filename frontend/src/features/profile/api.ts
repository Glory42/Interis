import { z } from "zod";
import { apiRequest } from "@/lib/api-client";
import {
  diaryEntrySchema,
  meProfileSchema,
  profileUpdateResponseSchema,
  publicProfileSchema,
  updateUsernameInputSchema,
  updateUsernameResponseSchema,
  type DiaryEntry,
  type MeProfile,
  type ProfileUpdateResponse,
  type PublicProfile,
  type UpdateProfileInput,
  type UpdateUsernameInput,
  type UpdateUsernameResponse,
} from "@/types/api";

const profileDiaryResponseSchema = z.array(diaryEntrySchema);

export const getUserProfile = async (username: string): Promise<PublicProfile> => {
  const response = await apiRequest<unknown>(`/api/users/${username}`, {
    method: "GET",
  });

  return publicProfileSchema.parse(response);
};

export const getUserDiary = async (username: string): Promise<DiaryEntry[]> => {
  const response = await apiRequest<unknown>(`/api/users/${username}/diary`, {
    method: "GET",
  });

  return profileDiaryResponseSchema.parse(response);
};

export const getMyProfile = async (): Promise<MeProfile> => {
  const response = await apiRequest<unknown>("/api/users/me", {
    method: "GET",
  });

  return meProfileSchema.parse(response);
};

export const updateMyProfile = async (
  payload: UpdateProfileInput,
): Promise<ProfileUpdateResponse> => {
  const response = await apiRequest<unknown, UpdateProfileInput>("/api/users/me", {
    method: "PUT",
    body: payload,
  });

  return profileUpdateResponseSchema.parse(response);
};

export const updateMyUsername = async (
  payload: UpdateUsernameInput,
): Promise<UpdateUsernameResponse> => {
  const parsedPayload = updateUsernameInputSchema.parse(payload);
  const response = await apiRequest<unknown, UpdateUsernameInput>(
    "/api/users/me/username",
    {
      method: "PUT",
      body: parsedPayload,
    },
  );

  return updateUsernameResponseSchema.parse(response);
};
