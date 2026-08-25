// A handful of accounts were briefly hashed with pbkdf2-sha256 during this
// app's short-lived Cloudflare Workers deployment (Bun's native argon2id
// isn't available under Workers). Bun.password doesn't recognize that
// format, so verify() falls back to checking it directly here and
// re-hashes with native argon2id on success, converging every account
// back onto Bun.password's format within one login. Safe to delete this
// fallback once no `$pbkdf2-sha256$` hashes remain in the credentials or
// security_answers tables.
const PBKDF2_FORMAT = /^\$pbkdf2-sha256\$i=(\d+)\$([^$]+)\$([^$]+)$/;

const base64ToBytes = (value: string): Uint8Array<ArrayBuffer> => {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const timingSafeEqual = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
};

const verifyLegacyPbkdf2 = async (plaintext: string, stored: string): Promise<boolean> => {
  const match = PBKDF2_FORMAT.exec(stored);
  if (!match) {
    return false;
  }

  const [, iterations, saltB64, hashB64] = match as unknown as [string, string, string, string];
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(plaintext),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: base64ToBytes(saltB64), iterations: Number(iterations), hash: "SHA-256" },
    keyMaterial,
    32 * 8,
  );
  return timingSafeEqual(new Uint8Array(derived), base64ToBytes(hashB64));
};

export type PasswordVerifyResult = {
  matches: boolean;
  // Set when `stored` was in the legacy pbkdf2-sha256 format and `matches`
  // is true — callers should persist this over the old hash.
  upgradedHash: string | null;
};

export class PasswordService {
  static async hash(plaintext: string): Promise<string> {
    return Bun.password.hash(plaintext, { algorithm: "argon2id" });
  }

  static async verify(plaintext: string, stored: string): Promise<PasswordVerifyResult> {
    if (stored.startsWith("$pbkdf2-sha256$")) {
      const matches = await verifyLegacyPbkdf2(plaintext, stored);
      return { matches, upgradedHash: matches ? await PasswordService.hash(plaintext) : null };
    }

    const matches = await Bun.password.verify(plaintext, stored);
    return { matches, upgradedHash: null };
  }
}
