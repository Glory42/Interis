import { z } from "zod";
import { apiRequest } from "@/lib/api-client";

const coverImageSchema = z.object({
  itemType: z.string(),
  posterPath: z.string().nullable(),
});

export const listSummarySchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    isRanked: z.boolean(),
    isPublic: z.boolean(),
    derivedType: z.string().nullable(),
    itemCount: z.number().int().nonnegative(),
    createdAt: z.string(),
    updatedAt: z.string(),
    coverImages: z.array(coverImageSchema),
    containsItem: z.boolean().optional(),
    entryId: z.string().nullable().optional(),
  })
  .passthrough();

const listItemSchema = z.object({
  id: z.string(),
  position: z.number().int(),
  itemType: z.string(),
  note: z.string().nullable(),
  tmdbId: z.number().int().nullable(),
  title: z.string().nullable(),
  posterPath: z.string().nullable(),
  releaseYear: z.number().int().nullable(),
});

export const listDetailSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    isRanked: z.boolean(),
    isPublic: z.boolean(),
    derivedType: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    itemCount: z.number().int().nonnegative(),
    items: z.array(listItemSchema),
    likeCount: z.number().int().nonnegative().optional().default(0),
    likedByViewer: z.boolean().optional().default(false),
  })
  .passthrough();

const listBaseSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    isRanked: z.boolean(),
    isPublic: z.boolean(),
    derivedType: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough();

export type ListSummary = z.infer<typeof listSummarySchema>;
export type ListDetail = z.infer<typeof listDetailSchema>;
export type ListItem = z.infer<typeof listItemSchema>;
export type ListBase = z.infer<typeof listBaseSchema>;

type QueryRequestOptions = {
  signal?: AbortSignal;
};

export const getUserLists = async (
  username: string,
  options: QueryRequestOptions = {},
): Promise<ListSummary[]> => {
  const response = await apiRequest<unknown>(
    `/api/users/${encodeURIComponent(username)}/lists`,
    { method: "GET", signal: options.signal },
  );
  return z.array(listSummarySchema).parse(response);
};

export const getUserListsForItem = async (
  username: string,
  tmdbId: number,
  itemType: "cinema" | "serial",
  options: QueryRequestOptions = {},
): Promise<ListSummary[]> => {
  const params = new URLSearchParams({
    tmdbId: String(tmdbId),
    itemType,
  });
  const response = await apiRequest<unknown>(
    `/api/users/${encodeURIComponent(username)}/lists?${params.toString()}`,
    { method: "GET", signal: options.signal },
  );
  return z.array(listSummarySchema).parse(response);
};

export const getListDetail = async (
  listId: string,
  options: QueryRequestOptions = {},
): Promise<ListDetail> => {
  const response = await apiRequest<unknown>(
    `/api/lists/${encodeURIComponent(listId)}`,
    { method: "GET", signal: options.signal },
  );
  return listDetailSchema.parse(response);
};

type CreateListBody = {
  title: string;
  description?: string;
  isPublic?: boolean;
  isRanked?: boolean;
};

export const createList = async (data: CreateListBody): Promise<ListBase> => {
  const response = await apiRequest<unknown, CreateListBody>("/api/lists", {
    method: "POST",
    body: data,
  });
  return listBaseSchema.parse(response);
};

type UpdateListBody = {
  title?: string;
  description?: string | null;
  isPublic?: boolean;
  isRanked?: boolean;
};

export const updateList = async (
  listId: string,
  data: UpdateListBody,
): Promise<ListBase> => {
  const response = await apiRequest<unknown, UpdateListBody>(
    `/api/lists/${encodeURIComponent(listId)}`,
    { method: "PATCH", body: data },
  );
  return listBaseSchema.parse(response);
};

export const deleteList = async (listId: string): Promise<void> => {
  await apiRequest<unknown>(`/api/lists/${encodeURIComponent(listId)}`, {
    method: "DELETE",
  });
};

type AddListItemBody = { tmdbId: number; itemType: "cinema" | "serial" };

export const addListItem = async (
  listId: string,
  data: AddListItemBody,
): Promise<{ entry: { id: string }; derivedType: string | null }> => {
  const response = await apiRequest<unknown, AddListItemBody>(
    `/api/lists/${encodeURIComponent(listId)}/items`,
    { method: "POST", body: data },
  );
  return z
    .object({
      entry: z.object({ id: z.string() }).passthrough(),
      derivedType: z.string().nullable(),
    })
    .parse(response);
};

export const removeListItem = async (
  listId: string,
  itemId: string,
): Promise<{ success: true; derivedType: string | null }> => {
  const response = await apiRequest<unknown>(
    `/api/lists/${encodeURIComponent(listId)}/items/${encodeURIComponent(itemId)}`,
    { method: "DELETE" },
  );
  return z
    .object({ success: z.literal(true), derivedType: z.string().nullable() })
    .parse(response);
};

export const likeList = async (listId: string): Promise<{ success: true; likeCount: number }> => {
  const response = await apiRequest<unknown>(
    `/api/lists/${encodeURIComponent(listId)}/like`,
    { method: "POST" },
  );
  return z.object({ success: z.literal(true), likeCount: z.number() }).parse(response);
};

export const unlikeList = async (listId: string): Promise<{ success: true; likeCount: number }> => {
  const response = await apiRequest<unknown>(
    `/api/lists/${encodeURIComponent(listId)}/like`,
    { method: "DELETE" },
  );
  return z.object({ success: z.literal(true), likeCount: z.number() }).parse(response);
};

type ReorderListItemsBody = { items: Array<{ id: string; position: number }> };

export const reorderListItems = async (
  listId: string,
  items: Array<{ id: string; position: number }>,
): Promise<void> => {
  await apiRequest<unknown, ReorderListItemsBody>(
    `/api/lists/${encodeURIComponent(listId)}/reorder`,
    { method: "PATCH", body: { items } },
  );
};
