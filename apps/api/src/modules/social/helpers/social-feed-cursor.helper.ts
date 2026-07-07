export type FeedCursor = {
  createdAt: Date;
  id: string;
};

// Opaque keyset cursor over (createdAt, id) so "load more" can resume
// exactly where the previous page left off instead of re-fetching the
// whole feed with a growing limit.
export const encodeFeedCursor = (cursor: FeedCursor): string =>
  Buffer.from(`${cursor.createdAt.toISOString()}|${cursor.id}`, "utf8").toString(
    "base64url",
  );

export const decodeFeedCursor = (raw: string | undefined): FeedCursor | undefined => {
  if (!raw) {
    return undefined;
  }

  try {
    const decoded = Buffer.from(raw, "base64url").toString("utf8");
    const separatorIndex = decoded.indexOf("|");
    if (separatorIndex === -1) {
      return undefined;
    }

    const iso = decoded.slice(0, separatorIndex);
    const id = decoded.slice(separatorIndex + 1);
    if (!id) {
      return undefined;
    }

    const createdAt = new Date(iso);
    if (Number.isNaN(createdAt.getTime())) {
      return undefined;
    }

    return { createdAt, id };
  } catch {
    return undefined;
  }
};
