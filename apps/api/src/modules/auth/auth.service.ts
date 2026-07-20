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
import { SecurityAnswersRepository } from "./repositories/security-answers.repository";
import { AuthProfileRepository } from "./repositories/auth-profile.repository";
import { PasswordService } from "./services/password.service";
import { SessionService } from "./services/session.service";
import { isPasswordValid } from "./policies/password.policy";
import { toAuthUser } from "./helpers/auth-user-mapper.helper";
import type { AuthUser, IssuedSession, SessionDeviceInfo } from "./types/auth.types";

export type SignupInput = { username: string; email: string; password: string };
export type LoginInput = { email: string; password: string };
export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
  revokeOtherSessions?: boolean;
};

// Case/whitespace-insensitive so "Fluffy" and "fluffy " still match.
const normalizeSecurityAnswer = (answer: string): string => answer.trim().toLowerCase();

const setPasswordForUser = async (userId: string, passwordHash: string): Promise<void> => {
  const credential = await AuthCredentialsRepository.findPasswordCredential(userId);

  if (credential) {
    await AuthCredentialsRepository.updatePasswordHash(credential.id, passwordHash);
    return;
  }

  await AuthCredentialsRepository.insert({
    id: randomUUID(),
    userId,
    type: "password",
    passwordHash,
  });
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

    const passwordCheck = await PasswordService.verify(input.password, credential.passwordHash);
    if (!passwordCheck.matches) {
      throw invalidCredentialsError;
    }

    if (passwordCheck.upgradedHash) {
      await AuthCredentialsRepository.updatePasswordHash(credential.id, passwordCheck.upgradedHash);
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

  static async setSecurityQuestion(
    userId: string,
    question: string,
    answer: string,
  ): Promise<void> {
    const answerHash = await PasswordService.hash(normalizeSecurityAnswer(answer));
    await SecurityAnswersRepository.upsert(userId, question, answerHash);
  }

  // Necessarily reveals whether an account with this email exists (the user
  // needs to see the question to answer it) - the answer itself stays
  // hashed and is never returned.
  static async getSecurityQuestionByEmail(email: string): Promise<{ question: string }> {
    const row = await SecurityAnswersRepository.findByEmail(email);
    if (!row) {
      throw new BadRequestError("No account with a security question for that email");
    }

    return { question: row.question };
  }

  static async resetPasswordWithSecurityAnswer(
    email: string,
    answer: string,
    newPassword: string,
  ): Promise<void> {
    if (!isPasswordValid(newPassword)) {
      throw new BadRequestError("Invalid password");
    }

    const row = await SecurityAnswersRepository.findByEmail(email);
    if (!row) {
      throw new BadRequestError("No account with a security question for that email");
    }

    const answerCheck = await PasswordService.verify(normalizeSecurityAnswer(answer), row.answerHash);
    if (!answerCheck.matches) {
      throw new UnauthorizedError("Incorrect answer");
    }

    if (answerCheck.upgradedHash) {
      await SecurityAnswersRepository.upsert(row.userId, row.question, answerCheck.upgradedHash);
    }

    const passwordHash = await PasswordService.hash(newPassword);
    await setPasswordForUser(row.userId, passwordHash);
    await SessionService.revokeAllSessionsForUser(row.userId);
  }

  // No answer/current-password verification — admin authority (requireAdmin)
  // substitutes for it. Used to recover pre-migration accounts that have
  // neither a password nor a security question set.
  static async adminResetPassword(username: string, newPassword: string): Promise<void> {
    if (!isPasswordValid(newPassword)) {
      throw new BadRequestError("Invalid password");
    }

    const userRow = await AuthUsersRepository.findByUsername(username);
    if (!userRow) {
      throw new BadRequestError("User not found");
    }

    const passwordHash = await PasswordService.hash(newPassword);
    await setPasswordForUser(userRow.id, passwordHash);
    await SessionService.revokeAllSessionsForUser(userRow.id);
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

    const currentPasswordCheck = await PasswordService.verify(
      input.currentPassword,
      credential.passwordHash,
    );
    if (!currentPasswordCheck.matches) {
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

  static async deleteAccount(userId: string): Promise<void> {
    await SessionService.revokeAllSessionsForUser(userId);
    await AuthUsersRepository.deleteById(userId);
  }

  static async changeEmail(
    userId: string,
    newEmail: string,
    answer: string,
  ): Promise<AuthUser> {
    const securityAnswer = await SecurityAnswersRepository.findByUserId(userId);
    if (!securityAnswer) {
      throw new BadRequestError("Set up a security question before changing your email");
    }

    const answerCheck = await PasswordService.verify(
      normalizeSecurityAnswer(answer),
      securityAnswer.answerHash,
    );
    if (!answerCheck.matches) {
      throw new UnauthorizedError("Incorrect answer");
    }

    if (answerCheck.upgradedHash) {
      await SecurityAnswersRepository.upsert(
        userId,
        securityAnswer.question,
        answerCheck.upgradedHash,
      );
    }

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
