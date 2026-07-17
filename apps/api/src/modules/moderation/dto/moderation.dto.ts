import { z } from "zod";

export const UsernameParamsSchema = z.object({
  username: z.string().trim().min(1),
});

export type UsernameParams = z.input<typeof UsernameParamsSchema>;
