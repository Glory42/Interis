import { z } from "zod";

export const SignUpSchema = z.object({
  username: z.string().min(1).max(64),
  email: z.string().email(),
  password: z.string().min(1).max(256),
});

export const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(256),
});

export const UpdateUserSchema = z.object({
  username: z.string().min(1).max(64),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(256),
  newPassword: z.string().min(1).max(256),
  revokeOtherSessions: z.boolean().optional(),
});

export const ChangeEmailSchema = z.object({
  newEmail: z.string().email(),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(1).max(256),
});
