import setupWasm from "argon2id/lib/setup.js";
// @ts-expect-error - wasm import, statically compiled by wrangler's bundler
import argon2idSimdWasm from "argon2id/dist/simd.wasm";
// @ts-expect-error - wasm import
import argon2idNonSimdWasm from "argon2id/dist/no-simd.wasm";
import type { computeHash as Argon2idComputeHash } from "argon2id/lib/setup";

// Cloudflare Workers' production crypto.subtle hard-caps PBKDF2 at 100,000
// iterations (NotSupportedError above that) - wrangler dev's local
// simulator doesn't enforce this, so it only surfaces once deployed. Below
// OWASP's 2023 minimum of 600,000, but this is the runtime's ceiling.
const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_HASH_LENGTH_BYTES = 32;
const SALT_LENGTH_BYTES = 16;

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/=+$/, "");
};

const base64ToBytes = (value: string): Uint8Array<ArrayBuffer> => {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const derivePbkdf2 = async (
  plaintext: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<Uint8Array> => {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(plaintext),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    keyMaterial,
    PBKDF2_HASH_LENGTH_BYTES * 8,
  );
  return new Uint8Array(bits);
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

const hashPbkdf2 = async (plaintext: string): Promise<string> => {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH_BYTES));
  const derived = await derivePbkdf2(plaintext, salt, PBKDF2_ITERATIONS);
  return `$pbkdf2-sha256$i=${PBKDF2_ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(derived)}`;
};

const PBKDF2_FORMAT = /^\$pbkdf2-sha256\$i=(\d+)\$([^$]+)\$([^$]+)$/;

const verifyPbkdf2 = async (plaintext: string, stored: string): Promise<boolean> => {
  const match = PBKDF2_FORMAT.exec(stored);
  if (!match) {
    return false;
  }

  const [, iterations, saltB64, hashB64] = match as unknown as [string, string, string, string];
  const derived = await derivePbkdf2(plaintext, base64ToBytes(saltB64), Number(iterations));
  return timingSafeEqual(derived, base64ToBytes(hashB64));
};

const LEGACY_ARGON2ID_FORMAT = /^\$argon2id\$v=19\$m=(\d+),t=(\d+),p=(\d+)\$([^$]+)\$([^$]+)$/;

// A `.wasm` import's shape differs by runtime: wrangler gives a precompiled
// WebAssembly.Module (instantiating returns a bare Instance), Bun gives the
// file path as a string instead of bytes. argon2id's setupWasm() always
// wants {instance, module}, so normalize based on what came through.
const instantiateWasmModule = async (
  wasmModuleOrBytesOrPath: WebAssembly.Module | ArrayBuffer | Uint8Array | string,
  importObject: NonNullable<Parameters<typeof WebAssembly.instantiate>[1]>,
) => {
  if (wasmModuleOrBytesOrPath instanceof WebAssembly.Module) {
    const instance = await WebAssembly.instantiate(wasmModuleOrBytesOrPath, importObject);
    return { instance, module: wasmModuleOrBytesOrPath };
  }

  if (typeof wasmModuleOrBytesOrPath === "string") {
    const bytes = await Bun.file(wasmModuleOrBytesOrPath).arrayBuffer();
    return WebAssembly.instantiate(bytes, importObject);
  }

  return WebAssembly.instantiate(wasmModuleOrBytesOrPath, importObject);
};

let argon2idComputeHash: Promise<Argon2idComputeHash> | null = null;
const getArgon2idComputeHash = (): Promise<Argon2idComputeHash> => {
  if (!argon2idComputeHash) {
    argon2idComputeHash = setupWasm(
      (io) => instantiateWasmModule(argon2idSimdWasm, io),
      (io) => instantiateWasmModule(argon2idNonSimdWasm, io),
    );
  }
  return argon2idComputeHash;
};

// Hashes created by Bun.password (pre-Workers-migration). Bun's argon2id
// isn't available under Workers, and most WASM argon2 libraries hit
// Workers' dynamic-codegen restriction - `argon2id` sidesteps this via
// statically-imported .wasm files precompiled by wrangler's bundler.
// Confirmed byte-for-byte compatible with Bun's output.
const verifyLegacyArgon2id = async (plaintext: string, stored: string): Promise<boolean> => {
  const match = LEGACY_ARGON2ID_FORMAT.exec(stored);
  if (!match) {
    return false;
  }

  const [, m, t, p, saltB64, hashB64] = match as unknown as [
    string,
    string,
    string,
    string,
    string,
    string,
  ];
  const expected = base64ToBytes(hashB64);
  const computeHash = await getArgon2idComputeHash();
  const derived = computeHash({
    password: new TextEncoder().encode(plaintext),
    salt: base64ToBytes(saltB64),
    parallelism: Number(p),
    passes: Number(t),
    memorySize: Number(m),
    tagLength: expected.length,
  });
  return timingSafeEqual(derived, expected);
};

export type PasswordVerifyResult = {
  matches: boolean;
  // Set when `stored` was in the legacy argon2id format and `matches` is
  // true — callers should persist this over the old hash so every account
  // converges onto pbkdf2-sha256 after its next successful login.
  upgradedHash: string | null;
};

export class PasswordService {
  static async hash(plaintext: string): Promise<string> {
    return hashPbkdf2(plaintext);
  }

  static async verify(plaintext: string, stored: string): Promise<PasswordVerifyResult> {
    if (stored.startsWith("$argon2id$")) {
      const matches = await verifyLegacyArgon2id(plaintext, stored);
      return { matches, upgradedHash: matches ? await hashPbkdf2(plaintext) : null };
    }

    const matches = await verifyPbkdf2(plaintext, stored);
    return { matches, upgradedHash: null };
  }
}
