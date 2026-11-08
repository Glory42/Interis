const PREFIX = "interis:review-draft:";

// Storage can throw (private mode, quota); a lost draft is better than a broken form.
export const readReviewDraft = (key: string): string => {
  try {
    return window.localStorage.getItem(PREFIX + key) ?? "";
  } catch {
    return "";
  }
};

export const writeReviewDraft = (key: string, text: string) => {
  try {
    if (text.trim().length === 0) window.localStorage.removeItem(PREFIX + key);
    else window.localStorage.setItem(PREFIX + key, text);
  } catch {
    // ignore
  }
};

export const clearReviewDraft = (key: string) => writeReviewDraft(key, "");
