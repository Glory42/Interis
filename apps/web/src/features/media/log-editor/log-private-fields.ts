import type { LogPrivateFields } from "@/features/diary/api";

// Only the fields the user touched in this editor; the rest follow the saved log.
export type PrivateFieldsEdit = { note?: string; tags?: string[] };

export const EMPTY_PRIVATE_FIELDS: LogPrivateFields = { note: null, tags: [] };

const sameTags = (left: string[], right: string[]) =>
  left.length === right.length && [...left].sort().join("\n") === [...right].sort().join("\n");

export const currentPrivateFields = (baseline: LogPrivateFields | null, edit: PrivateFieldsEdit) => ({
  note: edit.note ?? baseline?.note ?? "",
  tags: edit.tags ?? baseline?.tags ?? [],
});

// A log edit's note and tags changes; a blank note clears it.
export const privateFieldChanges = (
  baseline: LogPrivateFields,
  edit: PrivateFieldsEdit,
): { note?: string | null; tags?: string[] } => {
  const note = edit.note?.trim();
  return {
    ...(note !== undefined && note !== (baseline.note ?? "") && { note: note || null }),
    ...(edit.tags !== undefined && !sameTags(edit.tags, baseline.tags) && { tags: edit.tags }),
  };
};
