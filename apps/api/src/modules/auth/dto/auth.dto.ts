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

// Deleting the account and changing the email or an existing security
// question each need the current password, not just a session (#136).
const currentPasswordSchema = z.string().min(1).max(256);

export const ChangeEmailSchema = z.object({
  newEmail: z.string().email(),
  currentPassword: currentPasswordSchema,
});

export const DeleteAccountSchema = z.object({
  currentPassword: currentPasswordSchema,
});

export const SecurityQuestionSchema = z.object({
  question: z.string().min(4).max(200),
  answer: z.string().min(1).max(200),
  // Only needed to replace an existing question.
  currentPassword: currentPasswordSchema.optional(),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email(),
  answer: z.string().min(1).max(200),
  newPassword: z.string().min(1).max(256),
});
