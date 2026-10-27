import { apiRequest, isApiError } from "./client";
import {
  loginInputSchema,
  meProfileSchema,
  registerInputSchema,
  type LoginInput,
  type MeProfile,
  type RegisterInput,
} from "@/types/auth";

export const getCurrentUser = async (): Promise<MeProfile | null> => {
  try {
    const response = await apiRequest<unknown>("/api/users/me");
    return meProfileSchema.parse(response);
  } catch (error) {
    if (isApiError(error) && error.status === 401) {
      return null;
    }
    throw error;
  }
};

export const loginWithEmail = async (input: LoginInput): Promise<void> => {
  await apiRequest<unknown, LoginInput>("/api/auth/sign-in/email", {
    method: "POST",
    body: loginInputSchema.parse(input),
  });
};

export const registerWithEmail = async (input: RegisterInput): Promise<void> => {
  const payload = registerInputSchema.parse({
    ...input,
    username: input.username.trim().toLowerCase(),
  });

  await apiRequest<unknown, RegisterInput>("/api/auth/sign-up/email", {
    method: "POST",
    body: payload,
  });
};

export const logoutCurrentUser = async (): Promise<void> => {
  try {
    await apiRequest<unknown>("/api/auth/sign-out", { method: "POST" });
  } catch (error) {
    if (isApiError(error) && error.status === 401) {
      return;
    }
    throw error;
  }
};

export const updateMyTheme = async (themeId: string): Promise<void> => {
  await apiRequest<unknown, { themeId: string }>("/api/users/me/theme", {
    method: "PUT",
    body: { themeId },
  });
};
