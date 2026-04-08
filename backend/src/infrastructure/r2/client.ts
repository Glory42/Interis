import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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
  return {
    accountId: requireEnv("R2_ACCOUNT_ID"),
    accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    bucket: requireEnv("R2_BUCKET_NAME"),
    publicUrl: requireEnv("R2_PUBLIC_URL").replace(/\/+$/, ""),
  };
};

const getClient = (config: R2Config) => {
  return new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
};

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

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
  const key = `${uploadType}s/${userId}.${ext}`;

  const client = getClient(config);
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: fileSizeBytes,
  });

  const signedUrl = await getSignedUrl(client, command, { expiresIn: 300 });
  const publicUrl = `${config.publicUrl}/${key}`;

  return { signedUrl, publicUrl, key };
};

export const deleteObject = async (key: string) => {
  const config = getConfig();
  const client = getClient(config);
  await client.send(
    new DeleteObjectCommand({ Bucket: config.bucket, Key: key }),
  );
};
