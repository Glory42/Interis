// Posted by public/push-sw.js to open app tabs.
export const PUSH_RECEIVED = "interis:push-received";
export const PUSH_OPEN_URL = "interis:push-open-url";

export const toAppPath = (value: unknown): string | null =>
  typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : null;
