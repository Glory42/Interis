import { z } from "zod";
import { paginationQuerySchema } from "../../../commons/validation/common.schemas";

export const UsernameParamsSchema = z.object({
  username: z.string().trim().min(1),
});

export type UsernameParams = z.input<typeof UsernameParamsSchema>;

export const ModerationListQuerySchema = paginationQuerySchema;

export const MODERATION_LIST_DEFAULT_LIMIT = 25;
