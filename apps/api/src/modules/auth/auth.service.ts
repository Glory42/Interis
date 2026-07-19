import { randomUUID } from "node:crypto";
import {
  normalizeUsername,
  isUsernameValid,
} from "../users/policies/username.policy";
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
} from "../../commons/errors/app-error";
import { AuthUsersRepository } from "./repositories/auth-users.repository";
import { AuthCredentialsRepository } from "./repositories/auth-credentials.repository";
import { AuthPasswordResetRepository } from "./repositories/auth-password-reset.repository";
import { AuthProfileRepository } from "./repositories/auth-profile.repository";
import { PasswordService } from "./services/password.service";
import { SessionService } from "./services/session.service";
import { TokenService } from "./services/token.service";
import { EmailService } from "./services/email.service";
import { isPasswordValid } from "./policies/password.policy";
import { toAuthUser } from "./helpers/auth-user-mapper.helper";
import type { AuthUser, IssuedSession, SessionDeviceInfo } from "./types/auth.types";

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

export type SignupInput = { username: string; email: string; password: string };
export type LoginInput = { email: string; password: string };
export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
  revokeOtherSessions?: boolean;
};

export class AuthService {
  static async signup(
    input: SignupInput,
    deviceInfo: SessionDeviceInfo = {},
  ): Promise<{ user: AuthUser; session: IssuedSession }> {
    const normalizedUsername = normalizeUsername(input.username);
    if (!isUsernameValid(normalizedUsername)) {
      throw new BadRequestError("Invalid username");
    }

    if (!isPasswordValid(input.password)) {
      throw new BadRequestError("Invalid password");
    }

    const [existingByUsername, existingByEmail] = await Promise.all([
      AuthUsersRepository.findByUsername(normalizedUsername),
      AuthUsersRepository.findByEmail(input.email),
    ]);

    if (existingByUsername) {
      throw new ConflictError("Username is already taken");
    }
    if (existingByEmail) {
      throw new ConflictError("Email is already registered");
    }

    const passwordHash = await PasswordService.hash(input.password);
    const userId = randomUUID();

    const createdUser = await AuthUsersRepository.insert({
      id: userId,
      name: normalizedUsername,
      email: input.email,
      emailVerified: false,
      username: normalizedUsername,
      displayUsername: normalizedUsername,
    });

    await AuthProfileRepository.createDefaultProfile(userId);

    await AuthCredentialsRepository.insert({
      id: randomUUID(),
      userId,
      type: "password",
      passwordHash,
    });

    const session = await SessionService.createSession(userId, deviceInfo);
    return { user: toAuthUser(createdUser), session };
  }

  static async login(
    input: LoginInput,
    deviceInfo: SessionDeviceInfo = {},
  ): Promise<{ user: AuthUser; session: IssuedSession }> {
    const invalidCredentialsError = new UnauthorizedError("Invalid email or password");

    const userRow = await AuthUsersRepository.findByEmail(input.email);
    if (!userRow) {
      throw invalidCredentialsError;
    }

    const credential = await AuthCredentialsRepository.findPasswordCredential(userRow.id);
    if (!credential || !credential.passwordHash) {
      throw invalidCredentialsError;
    }

    const passwordMatches = await PasswordService.verify(
      input.password,
      credential.passwordHash,
    );
    if (!passwordMatches) {
      throw invalidCredentialsError;
    }

    const session = await SessionService.createSession(userRow.id, deviceInfo);
    return { user: toAuthUser(userRow), session };
  }

  static async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }

    await SessionService.revokeSessionByRefreshToken(refreshToken);
  }

  static async requestPasswordReset(email: string): Promise<void> {
    const userRow = await AuthUsersRepository.findByEmail(email);
    if (!userRow) {
      // Don't reveal whether the email exists.
      return;
    }

    const token = TokenService.generateOpaqueToken();
    await AuthPasswordResetRepository.insert({
      id: randomUUID(),
      userId: userRow.id,
      tokenHash: TokenService.hashOpaqueToken(token),
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
    });

    await EmailService.sendPasswordResetEmail(userRow.email, token);
  }

  static async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!isPasswordValid(newPassword)) {
      throw new BadRequestError("Invalid password");
    }

    const tokenHash = TokenService.hashOpaqueToken(token);
    const resetRow = await AuthPasswordResetRepository.findByTokenHash(tokenHash);

    const isUsable =
      resetRow && !resetRow.usedAt && resetRow.expiresAt.getTime() > Date.now();
    if (!resetRow || !isUsable) {
      throw new BadRequestError("Invalid or expired reset token");
    }

    const passwordHash = await PasswordService.hash(newPassword);
    const credential = await AuthCredentialsRepository.findPasswordCredential(
      resetRow.userId,
    );

    if (credential) {
      await AuthCredentialsRepository.updatePasswordHash(credential.id, passwordHash);
    } else {
      await AuthCredentialsRepository.insert({
        id: randomUUID(),
        userId: resetRow.userId,
        type: "password",
        passwordHash,
      });
    }

    await AuthPasswordResetRepository.markUsed(resetRow.id);
    await SessionService.revokeAllSessionsForUser(resetRow.userId);
  }

  static async changePassword(
    userId: string,
    currentSessionId: string,
    input: ChangePasswordInput,
  ): Promise<void> {
    const credential = await AuthCredentialsRepository.findPasswordCredential(userId);
    if (!credential || !credential.passwordHash) {
      throw new UnauthorizedError("No password set for this account");
    }

    const currentMatches = await PasswordService.verify(
      input.currentPassword,
      credential.passwordHash,
    );
    if (!currentMatches) {
      throw new UnauthorizedError("Current password is incorrect");
    }

    if (!isPasswordValid(input.newPassword)) {
      throw new BadRequestError("Invalid password");
    }

    const newPasswordHash = await PasswordService.hash(input.newPassword);
    await AuthCredentialsRepository.updatePasswordHash(credential.id, newPasswordHash);

    if (input.revokeOtherSessions) {
      await SessionService.revokeAllSessionsForUser(userId, currentSessionId);
    }
  }

  static async updateIdentity(userId: string, username: string): Promise<AuthUser> {
    const normalizedUsername = normalizeUsername(username);
    if (!isUsernameValid(normalizedUsername)) {
      throw new BadRequestError("Invalid username");
    }

    const existing = await AuthUsersRepository.findByUsername(normalizedUsername);
    if (existing && existing.id !== userId) {
      throw new ConflictError("Username is already taken");
    }

    const updated = await AuthUsersRepository.updateIdentity(userId, {
      username: normalizedUsername,
      displayUsername: normalizedUsername,
      name: normalizedUsername,
    });

    if (!updated) {
      throw new BadRequestError("User not found");
    }

    return toAuthUser(updated);
  }

  static async changeEmail(userId: string, newEmail: string): Promise<AuthUser> {
    const existing = await AuthUsersRepository.findByEmail(newEmail);
    if (existing && existing.id !== userId) {
      throw new ConflictError("Email is already registered");
    }

    const updated = await AuthUsersRepository.updateEmail(userId, newEmail);
    if (!updated) {
      throw new BadRequestError("User not found");
    }

    return toAuthUser(updated);
  }
}
