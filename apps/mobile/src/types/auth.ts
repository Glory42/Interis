import { z } from "zod";

export const favoriteGenreValues = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "History",
  "Horror",
  "Music",
  "Mystery",
  "Romance",
  "Science Fiction",
  "Thriller",
  "War",
  "Western",
] as const;

export const favoriteGenreSchema = z.enum(favoriteGenreValues);

export const meProfileSchema = z
  .object({
    id: z.string(),
    name: z.string().nullish(),
    email: z.email(),
    username: z.string(),
    bio: z.string().nullish(),
    location: z.string().nullish(),
    avatarUrl: z.string().nullish(),
    favoriteGenres: z.array(favoriteGenreSchema).nullish(),
    themeId: z.string().optional(),
    isAdmin: z.boolean(),
    createdAt: z.string().optional(),
    hasSecurityQuestion: z.boolean(),
  })
  .passthrough();

export const loginInputSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerInputSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be 3-20 characters")
    .max(20, "Username must be 3-20 characters")
    .regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers and underscores"),
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export type MeProfile = z.infer<typeof meProfileSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
export type RegisterInput = z.infer<typeof registerInputSchema>;
