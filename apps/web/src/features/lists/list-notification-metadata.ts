// List notifications snapshot the List title at the time they were sent.
export const listTitleFrom = (metadata: string | null): string | null => {
  try {
    const parsed = JSON.parse(metadata ?? "{}") as { listTitle?: unknown };
    return typeof parsed.listTitle === "string" ? parsed.listTitle : null;
  } catch {
    return null;
  }
};
