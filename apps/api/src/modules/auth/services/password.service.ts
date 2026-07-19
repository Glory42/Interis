export class PasswordService {
  static async hash(plaintext: string): Promise<string> {
    return Bun.password.hash(plaintext, { algorithm: "argon2id" });
  }

  static async verify(plaintext: string, hash: string): Promise<boolean> {
    return Bun.password.verify(plaintext, hash);
  }
}
