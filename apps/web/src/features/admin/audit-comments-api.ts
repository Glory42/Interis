import { z } from "zod";
import { appendPageParams, type AdminPage } from "@/features/admin/pagination";
import { apiRequest } from "@/lib/api-client";

const adminCommentSchema = z.object({
  kind: z.enum(["review", "post"]),
  id: z.string(),
  content: z.string(),
  createdAt: z.coerce.date(),
  parentId: z.string(),
  authorUsername: z.string().nullable(),
});

export type AdminComment = z.infer<typeof adminCommentSchema>;

export const listAdminComments = async (page: AdminPage): Promise<AdminComment[]> => {
  const params = new URLSearchParams();
  appendPageParams(params, page);
  return z.array(adminCommentSchema).parse(await apiRequest<unknown>(`/api/admin/comments?${params}`));
};

export const deleteAdminComment = async ({ kind, id }: { kind: AdminComment["kind"]; id: string }): Promise<void> => {
  await apiRequest<unknown>(`/api/admin/comments/${kind}/${encodeURIComponent(id)}`, { method: "DELETE" });
};

const auditEntrySchema = z.object({
  id: z.string(),
  actorUsername: z.string(),
  action: z.string(),
  targetType: z.string(),
  targetId: z.string(),
  targetLabel: z.string().nullable(),
  reason: z.string().nullable(),
  createdAt: z.coerce.date(),
});

const auditPageSchema = z.object({ items: z.array(auditEntrySchema), nextCursor: z.string().nullable() });

export type AuditEntry = z.infer<typeof auditEntrySchema>;

export const listAuditLog = async (input: { actor?: string; cursor?: string }) => {
  const params = new URLSearchParams();
  if (input.actor) params.set("actor", input.actor);
  if (input.cursor) params.set("cursor", input.cursor);
  return auditPageSchema.parse(await apiRequest<unknown>(`/api/admin/audit?${params}`));
};
