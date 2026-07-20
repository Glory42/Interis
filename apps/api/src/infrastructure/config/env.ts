import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(15 * 60),
  REFRESH_TOKEN_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(30 * 24 * 60 * 60),
  AUTH_ACCESS_COOKIE_NAME: z.string().min(1).default("interis_access_token"),
  AUTH_REFRESH_COOKIE_NAME: z.string().min(1).default("interis_refresh_token"),
  TMDB_ACCESS_TOKEN: z.string().min(1, "TMDB_ACCESS_TOKEN is required"),
  CORS_ORIGIN: z.string().optional(),
  // z.coerce.boolean() uses Boolean(value) semantics, not string parsing -
  // Boolean("false") is `true`. z.stringbool() parses "true"/"false" as
  // actual booleans instead.
  USE_LOCAL_DB_PROXY: z.stringbool().default(false),
});

export type Env = z.infer<typeof envSchema>;

const formatIssues = (error: z.ZodError): string => {
  return error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
};

const loadEnv = (): Env => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    // process.exit() crash-kills the request with an opaque error under
    // Workers instead of surfacing this message - a normal throw reads
    // consistently in both Bun and Workers logs.
    throw new Error(
      `Invalid environment configuration:\n${formatIssues(result.error)}`,
    );
  }

  return result.data;
};

export const env = loadEnv();
