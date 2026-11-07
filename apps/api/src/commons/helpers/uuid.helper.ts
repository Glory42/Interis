const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Guards uuid columns: Postgres rejects a malformed id instead of matching nothing.
export const isUuid = (value: string): boolean => UUID_RE.test(value);
