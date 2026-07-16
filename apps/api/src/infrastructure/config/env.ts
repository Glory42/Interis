import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  BETTER_AUTH_URL: z.url("BETTER_AUTH_URL must be a valid URL"),
  BETTER_AUTH_SECRET: z
    .string()
    .min(16, "BETTER_AUTH_SECRET must be at least 16 characters"),
  TMDB_ACCESS_TOKEN: z.string().min(1, "TMDB_ACCESS_TOKEN is required"),
  CORS_ORIGIN: z.string().optional(),
  USE_LOCAL_DB_PROXY: z.coerce.boolean().default(false),
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
    console.error(
      `Invalid environment configuration:\n${formatIssues(result.error)}`,
    );
    process.exit(1);
  }

  return result.data;
};

export const env = loadEnv();
