import type { Context } from "hono";
import type { AppEnv } from "../../infrastructure/http/hono-context.types";
import {
  sendBadRequest,
  sendConflict,
  sendUnauthorized,
  sendValidationError,
} from "../../commons/http/validation-response.hono";
import { AppError } from "../../commons/errors/app-error";
import { AuthService } from "./auth.service";
import {
  ChangeEmailSchema,
  ChangePasswordSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  SecurityQuestionSchema,
  SignInSchema,
  SignUpSchema,
  UpdateUserSchema,
} from "./dto/auth.dto";
import {
  clearAuthCookies,
  getDeviceInfoFromHonoContext,
  setAuthCookies,
} from "./helpers/auth-cookies.hono";
import { getRefreshTokenFromHonoContext } from "../../commons/auth/session-resolver.hono";

const handleAuthError = (c: Context, error: unknown): Response => {
  if (error instanceof AppError) {
    if (error.code === "UNAUTHORIZED") {
      return sendUnauthorized(c, error.message);
    }
    if (error.code === "CONFLICT") {
      return sendConflict(c, error.message);
    }
    return sendBadRequest(c, error.message);
  }

  throw error;
};

export class AuthController {
  // POST /api/auth/sign-up/email
  static async signUp(c: Context<AppEnv>): Promise<Response> {
    const parsed = SignUpSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    try {
      const { user, session } = await AuthService.signup(
        parsed.data,
        getDeviceInfoFromHonoContext(c),
      );
      setAuthCookies(c, session);
      return c.json({ user }, 201);
    } catch (error) {
      return handleAuthError(c, error);
    }
  }

  // POST /api/auth/sign-in/email
  static async signIn(c: Context<AppEnv>): Promise<Response> {
    const parsed = SignInSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    try {
      const { user, session } = await AuthService.login(
        parsed.data,
        getDeviceInfoFromHonoContext(c),
      );
      setAuthCookies(c, session);
      return c.json({ user }, 200);
    } catch (error) {
      return handleAuthError(c, error);
    }
  }

  // POST /api/auth/sign-out
  static async signOut(c: Context<AppEnv>): Promise<Response> {
    await AuthService.logout(getRefreshTokenFromHonoContext(c) ?? undefined);
    clearAuthCookies(c);
    return c.json({ success: true }, 200);
  }

  // POST /api/auth/update-user
  static async updateUser(c: Context<AppEnv>): Promise<Response> {
    const parsed = UpdateUserSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    try {
      const user = await AuthService.updateIdentity(c.get("user").id, parsed.data.username);
      return c.json({ user }, 200);
    } catch (error) {
      return handleAuthError(c, error);
    }
  }

  // POST /api/auth/change-password
  static async changePassword(c: Context<AppEnv>): Promise<Response> {
    const parsed = ChangePasswordSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    try {
      await AuthService.changePassword(c.get("user").id, c.get("session").id, parsed.data);
      return c.json({ success: true }, 200);
    } catch (error) {
      return handleAuthError(c, error);
    }
  }

  // POST /api/auth/change-email
  static async changeEmail(c: Context<AppEnv>): Promise<Response> {
    const parsed = ChangeEmailSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    try {
      const user = await AuthService.changeEmail(
        c.get("user").id,
        parsed.data.newEmail,
        parsed.data.answer,
      );
      return c.json({ user }, 200);
    } catch (error) {
      return handleAuthError(c, error);
    }
  }

  // DELETE /api/auth/account — permanently deletes the caller's own
  // account and everything FK-cascaded from it (diary, reviews, follows,
  // lists, etc.), then clears their session.
  static async deleteAccount(c: Context<AppEnv>): Promise<Response> {
    await AuthService.deleteAccount(c.get("user").id);
    clearAuthCookies(c);
    return c.json({ success: true }, 200);
  }

  // POST /api/auth/security-question
  static async setSecurityQuestion(c: Context<AppEnv>): Promise<Response> {
    const parsed = SecurityQuestionSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    await AuthService.setSecurityQuestion(c.get("user").id, parsed.data.question, parsed.data.answer);
    return c.json({ success: true }, 200);
  }

  // POST /api/auth/forgot-password — looks up the account's security
  // question by email (necessarily reveals whether the account exists).
  static async forgotPassword(c: Context<AppEnv>): Promise<Response> {
    const parsed = ForgotPasswordSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    try {
      const { question } = await AuthService.getSecurityQuestionByEmail(parsed.data.email);
      return c.json({ question }, 200);
    } catch (error) {
      return handleAuthError(c, error);
    }
  }

  // POST /api/auth/reset-password
  static async resetPassword(c: Context<AppEnv>): Promise<Response> {
    const parsed = ResetPasswordSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    try {
      await AuthService.resetPasswordWithSecurityAnswer(
        parsed.data.email,
        parsed.data.answer,
        parsed.data.newPassword,
      );
      return c.json({ success: true }, 200);
    } catch (error) {
      return handleAuthError(c, error);
    }
  }
}
