import { z } from "zod";

export const SignUpSchema = z.object({
  username: z.string().min(1).max(64),
  email: z.email(),
  password: z.string().min(1).max(256),
});

export const SignInSchema = z.object({
  email: z.email(),
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
  newEmail: z.email(),
  answer: z.string().min(1).max(200),
});

export const SecurityQuestionSchema = z.object({
  question: z.string().min(4).max(200),
  answer: z.string().min(1).max(200),
});

export const ForgotPasswordSchema = z.object({
  email: z.email(),
});

export const ResetPasswordSchema = z.object({
  email: z.email(),
  answer: z.string().min(1).max(200),
  newPassword: z.string().min(1).max(256),
});
