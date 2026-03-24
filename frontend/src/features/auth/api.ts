import { z } from "zod";
import { ApiError, apiRequest, isApiError } from "@/lib/api-client";
import {
  loginInputSchema,
  meProfileSchema,
  registerInputSchema,
  type LoginInput,
  type MeProfile,
  type RegisterInput,
} from "@/types/api";

const unknownAuthResponseSchema = z.unknown();

export const getCurrentUser = async (): Promise<MeProfile | null> => {
  try {
    const response = await apiRequest<unknown>("/api/users/me", {
      method: "GET",
    });
    return meProfileSchema.parse(response);
  } catch (error) {
    if (isApiError(error) && error.status === 401) {
      return null;
    }

    throw error;
  }
};

export const loginWithEmail = async (input: LoginInput): Promise<void> => {
  const payload = loginInputSchema.parse(input);

  const response = await apiRequest<unknown, LoginInput>(
    "/api/auth/sign-in/email",
    {
      method: "POST",
      body: payload,
    },
  );

  unknownAuthResponseSchema.parse(response);
};

export const registerWithEmail = async (
  input: RegisterInput,
): Promise<void> => {
  const payload = registerInputSchema.parse(input);

  const response = await apiRequest<unknown, RegisterInput>(
    "/api/auth/sign-up/email",
    {
      method: "POST",
      body: payload,
    },
  );

  unknownAuthResponseSchema.parse(response);
};

export const logoutCurrentUser = async (): Promise<void> => {
  try {
    await apiRequest<unknown>("/api/auth/sign-out", {
      method: "POST",
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return;
    }

    throw error;
  }
};
