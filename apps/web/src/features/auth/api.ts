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
import { syncThemeFromServer } from "@/features/theme/theme-runtime";
import { normalizeUsername, validateUsernameInput } from "@/features/auth/username";

const unknownAuthResponseSchema = z.unknown();

const changePasswordInputSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8).max(128),
  revokeOtherSessions: z.boolean().optional(),
});

const changeEmailInputSchema = z.object({
  newEmail: z.string().email(),
});

type UpdateIdentityInput = {
  username: string;
};

export const getCurrentUser = async (): Promise<MeProfile | null> => {
  try {
    const response = await apiRequest<unknown>("/api/users/me", {
      method: "GET",
    });
    const profile = meProfileSchema.parse(response);
    const themeId = syncThemeFromServer(profile.themeId);

    return {
      ...profile,
      themeId,
    };
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

  const normalizedUsername = normalizeUsername(payload.username);
  const usernameValidationError = validateUsernameInput(normalizedUsername);
  if (usernameValidationError) {
    throw new ApiError(400, usernameValidationError, {
      error: usernameValidationError,
    });
  }

  const authPayload = {
    username: normalizedUsername,
    displayUsername: normalizedUsername,
    name: normalizedUsername,
    email: payload.email,
    password: payload.password,
  };

  const response = await apiRequest<unknown, typeof authPayload>(
    "/api/auth/sign-up/email",
    {
      method: "POST",
      body: authPayload,
    },
  );

  unknownAuthResponseSchema.parse(response);
};

export const updateCurrentUserIdentity = async (
  input: UpdateIdentityInput,
): Promise<void> => {
  const normalizedUsername = normalizeUsername(input.username);
  const usernameValidationError = validateUsernameInput(normalizedUsername);
  if (usernameValidationError) {
    throw new ApiError(400, usernameValidationError, {
      error: usernameValidationError,
    });
  }

  const response = await apiRequest<unknown, Record<string, string>>(
    "/api/auth/update-user",
    {
      method: "POST",
      body: {
        username: normalizedUsername,
        displayUsername: normalizedUsername,
        name: normalizedUsername,
      },
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

export const changeCurrentUserPassword = async (input: {
  currentPassword: string;
  newPassword: string;
  revokeOtherSessions?: boolean;
}): Promise<void> => {
  const payload = changePasswordInputSchema.parse(input);

  const response = await apiRequest<unknown, typeof payload>(
    "/api/auth/change-password",
    {
      method: "POST",
      body: payload,
    },
  );

  unknownAuthResponseSchema.parse(response);
};

export const changeCurrentUserEmail = async (input: {
  newEmail: string;
}): Promise<void> => {
  const payload = changeEmailInputSchema.parse(input);

  const response = await apiRequest<unknown, typeof payload>(
    "/api/auth/change-email",
    {
      method: "POST",
      body: payload,
    },
  );

  unknownAuthResponseSchema.parse(response);
};
