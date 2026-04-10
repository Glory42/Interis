import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

export type UploadType = "avatar";

const REQUIRED_R2_ENV_KEYS = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_URL",
] as const;

type RequiredR2EnvKey = (typeof REQUIRED_R2_ENV_KEYS)[number];

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl: string;
};

let cachedConfig: R2Config | null = null;
let cachedClient: S3Client | null = null;
let cachedClientKey: string | null = null;

export class R2ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "R2ConfigurationError";
  }
}

export const isR2ConfigurationError = (
  error: unknown,
): error is R2ConfigurationError => error instanceof R2ConfigurationError;

const requireEnv = (key: RequiredR2EnvKey): string => {
  const value = process.env[key];
  if (!value || value.trim().length === 0) {
    throw new R2ConfigurationError(`${key} is missing`);
  }

  return value;
};

const getConfig = (): R2Config => {
  if (cachedConfig) {
    return cachedConfig;
  }

  cachedConfig = {
    accountId: requireEnv("R2_ACCOUNT_ID"),
    accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    bucket: requireEnv("R2_BUCKET_NAME"),
    publicUrl: requireEnv("R2_PUBLIC_URL").replace(/\/+$/, ""),
  };

  return cachedConfig;
};

const getClient = (config: R2Config) => {
  const clientKey = `${config.accountId}:${config.accessKeyId}:${config.bucket}`;
  if (cachedClient && cachedClientKey === clientKey) {
    return cachedClient;
  }

  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  cachedClientKey = clientKey;
  return cachedClient;
};

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

const getUploadPathPrefix = (uploadType: UploadType, userId: string): string => {
  return `${uploadType}s/${userId}`;
};

const buildUploadKey = (
  uploadType: UploadType,
  userId: string,
  ext: string,
): string => {
  return `${getUploadPathPrefix(uploadType, userId)}/${randomUUID()}.${ext}`;
};

const getPublicBaseUrl = (config: R2Config): URL => {
  return new URL(trimTrailingSlash(config.publicUrl));
};

export const isOwnedUploadPublicUrl = (
  userId: string,
  uploadType: UploadType,
  publicUrl: string,
): boolean => {
  const config = getConfig();

  try {
    const uploadedUrl = new URL(publicUrl);
    const configuredBase = getPublicBaseUrl(config);

    if (uploadedUrl.origin !== configuredBase.origin) {
      return false;
    }

    const basePath = trimTrailingSlash(configuredBase.pathname);
    const normalizedPath = uploadedUrl.pathname;
    const uploadPathPrefix = `${basePath}/${getUploadPathPrefix(uploadType, userId)}`;
    const legacyPathPrefix = `${basePath}/${uploadType}s/${userId}.`;

    return (
      normalizedPath.startsWith(`${uploadPathPrefix}/`) ||
      normalizedPath.startsWith(legacyPathPrefix)
    );
  } catch {
    return false;
  }
};

export const generateUploadUrl = async (
  userId: string,
  uploadType: UploadType,
  contentType: string,
  fileSizeBytes: number,
) => {
  const config = getConfig();

  const ext = ALLOWED_TYPES[contentType];
  if (!ext) throw new Error("Unsupported file type. Use JPEG, PNG, or WebP.");
  if (fileSizeBytes > MAX_SIZE_BYTES)
    throw new Error("File too large. Max 10MB.");

  const bucket = config.bucket;
  const key = buildUploadKey(uploadType, userId, ext);

  const client = getClient(config);
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: fileSizeBytes,
  });

  const signedUrl = await getSignedUrl(client, command, { expiresIn: 300 });
  const publicUrl = `${trimTrailingSlash(config.publicUrl)}/${key}`;

  return { signedUrl, publicUrl, key };
};

export const deleteObject = async (key: string) => {
  const config = getConfig();
  const client = getClient(config);
  await client.send(
    new DeleteObjectCommand({ Bucket: config.bucket, Key: key }),
  );
};
