import { z } from "zod";

export const CreateListSchema = z.object({
  title: z.string().min(1).max(100).trim(),
  description: z.string().max(500).trim().optional(),
  isPublic: z.boolean().default(true),
  isRanked: z.boolean().default(false),
});

export const UpdateListSchema = z.object({
  title: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(500).trim().nullable().optional(),
  isPublic: z.boolean().optional(),
  isRanked: z.boolean().optional(),
});

export const AddListItemSchema = z.object({
  tmdbId: z.number().int().positive(),
  itemType: z.enum(["cinema", "serial"]),
});

export const ReorderListItemsSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().uuid(),
        position: z.number().int().positive(),
      }),
    )
    .min(1),
});

export const GetUserListsQuerySchema = z.object({
  tmdbId: z.coerce.number().int().positive().optional(),
  itemType: z.enum(["cinema", "serial"]).optional(),
});

export type CreateListDto = z.infer<typeof CreateListSchema>;
export type UpdateListDto = z.infer<typeof UpdateListSchema>;
export type AddListItemDto = z.infer<typeof AddListItemSchema>;
export type ReorderListItemsDto = z.infer<typeof ReorderListItemsSchema>;
export type GetUserListsQueryDto = z.infer<typeof GetUserListsQuerySchema>;
