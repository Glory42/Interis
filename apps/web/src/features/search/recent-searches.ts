const KEY = "interis:recent-searches";
const MAX_RECENT = 8;

// Kept in localStorage only (no backend); storage errors just mean no recents.
export const readRecentSearches = (): string[] => {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === "string") : [];
  } catch {
    return [];
  }
};

export const pushRecentSearch = (query: string) => {
  const trimmed = query.trim();
  if (!trimmed) return;
  const next = [trimmed, ...readRecentSearches().filter((entry) => entry.toLowerCase() !== trimmed.toLowerCase())];
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next.slice(0, MAX_RECENT)));
  } catch {
    // ignore
  }
};

export const clearRecentSearches = () => {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
};
