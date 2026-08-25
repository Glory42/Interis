import { randomBytes, createHash } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { env } from "../../../infrastructure/config/env";
import type { AccessTokenClaims } from "../types/auth.types";

const secretKey = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

export class TokenService {
  static async signAccessToken(claims: AccessTokenClaims): Promise<string> {
    return new SignJWT({ sid: claims.sessionId })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(claims.userId)
      .setIssuedAt()
      .setExpirationTime(`${env.JWT_ACCESS_TTL_SECONDS}s`)
      .sign(secretKey);
  }

  static async verifyAccessToken(token: string): Promise<AccessTokenClaims | null> {
    try {
      const { payload } = await jwtVerify(token, secretKey);
      if (typeof payload.sub !== "string" || typeof payload.sid !== "string") {
        return null;
      }

      return { userId: payload.sub, sessionId: payload.sid };
    } catch {
      return null;
    }
  }

  // Used for both refresh tokens and password-reset tokens — opaque,
  // revocable, hashed at rest.
  static generateOpaqueToken(): string {
    return randomBytes(32).toString("base64url");
  }

  static hashOpaqueToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
