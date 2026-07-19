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
      const user = await AuthService.changeEmail(req.user.id, parsed.data.newEmail);
      res.status(200).json({ user });
    } catch (error) {
      handleAuthError(res, error);
    }
  }

  // POST /api/auth/forgot-password
  static async forgotPassword(req: Request, res: Response): Promise<void> {
    const parsed = ForgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    await AuthService.requestPasswordReset(parsed.data.email);
    // Always the same response — don't reveal whether the email exists.
    res.status(200).json({ success: true });
  }

  // POST /api/auth/reset-password
  static async resetPassword(req: Request, res: Response): Promise<void> {
    const parsed = ResetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    try {
      await AuthService.resetPassword(parsed.data.token, parsed.data.newPassword);
      res.status(200).json({ success: true });
    } catch (error) {
      handleAuthError(res, error);
    }
  }
}
