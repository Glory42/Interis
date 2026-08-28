import type { Request, Response } from "express";
import {
  sendBadRequest,
  sendConflict,
  sendUnauthorized,
  sendValidationError,
} from "../../commons/http/validation-response.helper";
import { AppError } from "../../commons/errors/app-error";
import { env } from "../../infrastructure/config/env";
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
  getDeviceInfoFromRequest,
  parseCookie,
  setAuthCookies,
} from "./helpers/auth-cookies.helper";

const handleAuthError = (res: Response, error: unknown): void => {
  if (error instanceof AppError) {
    if (error.code === "UNAUTHORIZED") {
      sendUnauthorized(res, error.message);
      return;
    }
    if (error.code === "CONFLICT") {
      sendConflict(res, error.message);
      return;
    }
    sendBadRequest(res, error.message);
    return;
  }

  throw error;
};

const getRefreshTokenFromRequest = (req: Request): string | undefined => {
  return parseCookie(req.headers.cookie, env.AUTH_REFRESH_COOKIE_NAME) ?? undefined;
};

export class AuthController {
  // POST /api/auth/sign-up/email
  static async signUp(req: Request, res: Response): Promise<void> {
    const parsed = SignUpSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    try {
      const { user, session } = await AuthService.signup(
        parsed.data,
        getDeviceInfoFromRequest(req),
      );
      setAuthCookies(res, session);
      res.status(201).json({ user });
    } catch (error) {
      handleAuthError(res, error);
    }
  }

  // POST /api/auth/sign-in/email
  static async signIn(req: Request, res: Response): Promise<void> {
    const parsed = SignInSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    try {
      const { user, session } = await AuthService.login(
        parsed.data,
        getDeviceInfoFromRequest(req),
      );
      setAuthCookies(res, session);
      res.status(200).json({ user });
    } catch (error) {
      handleAuthError(res, error);
    }
  }

  // POST /api/auth/sign-out
  static async signOut(req: Request, res: Response): Promise<void> {
    await AuthService.logout(getRefreshTokenFromRequest(req));
    clearAuthCookies(res);
    res.status(200).json({ success: true });
  }

  // POST /api/auth/update-user
  static async updateUser(req: Request, res: Response): Promise<void> {
    const parsed = UpdateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    try {
      const user = await AuthService.updateIdentity(req.user.id, parsed.data.username);
      res.status(200).json({ user });
    } catch (error) {
      handleAuthError(res, error);
    }
  }

  // POST /api/auth/change-password
  static async changePassword(req: Request, res: Response): Promise<void> {
    const parsed = ChangePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    try {
      await AuthService.changePassword(req.user.id, req.session.id, parsed.data);
      res.status(200).json({ success: true });
    } catch (error) {
      handleAuthError(res, error);
    }
  }

  // POST /api/auth/change-email
  static async changeEmail(req: Request, res: Response): Promise<void> {
    const parsed = ChangeEmailSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    try {
      const user = await AuthService.changeEmail(
        req.user.id,
        parsed.data.newEmail,
        parsed.data.answer,
      );
      res.status(200).json({ user });
    } catch (error) {
      handleAuthError(res, error);
    }
  }

  // DELETE /api/auth/account — permanently deletes the caller's own
  // account and everything FK-cascaded from it (diary, reviews, follows,
  // lists, etc.), then clears their session.
  static async deleteAccount(req: Request, res: Response): Promise<void> {
    // TEMPORARY diagnostic logging - see the matching comment in
    // src/index.ts. Remove once diagnosed.
    process.stdout.write(`[diag] deleteAccount handler entered for user ${req.user.id} at ${new Date().toISOString()}\n`);
    await AuthService.deleteAccount(req.user.id);
    process.stdout.write(`[diag] AuthService.deleteAccount resolved at ${new Date().toISOString()}\n`);
    clearAuthCookies(res);
    res.status(200).json({ success: true });
    process.stdout.write(`[diag] response sent at ${new Date().toISOString()}\n`);
  }

  // POST /api/auth/security-question
  static async setSecurityQuestion(req: Request, res: Response): Promise<void> {
    const parsed = SecurityQuestionSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    await AuthService.setSecurityQuestion(req.user.id, parsed.data.question, parsed.data.answer);
    res.status(200).json({ success: true });
  }

  // POST /api/auth/forgot-password — looks up the account's security
  // question by email (necessarily reveals whether the account exists).
  static async forgotPassword(req: Request, res: Response): Promise<void> {
    const parsed = ForgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    try {
      const { question } = await AuthService.getSecurityQuestionByEmail(parsed.data.email);
      res.status(200).json({ question });
    } catch (error) {
      handleAuthError(res, error);
    }
  }

  // POST /api/auth/reset-password
  static async resetPassword(req: Request, res: Response): Promise<void> {
    const parsed = ResetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    try {
      await AuthService.resetPasswordWithSecurityAnswer(
        parsed.data.email,
        parsed.data.answer,
        parsed.data.newPassword,
      );
      res.status(200).json({ success: true });
    } catch (error) {
      handleAuthError(res, error);
    }
  }
}
