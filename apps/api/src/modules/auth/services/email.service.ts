import { Resend } from "resend";
import { logger } from "../../../commons/utils/logger";
import { getTrustedOriginsFromEnv } from "../../../infrastructure/config/origins";

let cachedClient: Resend | null = null;
let cachedApiKey: string | null = null;

const getClient = (): Resend | null => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }

  if (cachedClient && cachedApiKey === apiKey) {
    return cachedClient;
  }

  cachedClient = new Resend(apiKey);
  cachedApiKey = apiKey;
  return cachedClient;
};

const buildResetLink = (token: string): string => {
  const [primaryOrigin] = getTrustedOriginsFromEnv();
  const base = primaryOrigin ?? "http://localhost:5173";
  return `${base}/reset-password?token=${encodeURIComponent(token)}`;
};

export class EmailService {
  // Sends the password-reset link. Falls back to logging the link when
  // RESEND_API_KEY / RESEND_FROM_EMAIL aren't configured (local dev) so the
  // reset flow stays testable without a real provider account.
  static async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const resetLink = buildResetLink(token);
    const client = getClient();
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    if (!client || !fromEmail) {
      logger.warn(
        { to, resetLink },
        "RESEND_API_KEY/RESEND_FROM_EMAIL not configured — logging password reset link instead of sending",
      );
      return;
    }

    const { error } = await client.emails.send({
      from: fromEmail,
      to,
      subject: "Reset your Interis password",
      html: `<p>Someone requested a password reset for your Interis account.</p><p><a href="${resetLink}">Reset your password</a></p><p>If you didn't request this, you can ignore this email.</p>`,
    });

    if (error) {
      logger.error(error, "Failed to send password reset email via Resend");
      throw new Error("Failed to send password reset email");
    }
  }
}
