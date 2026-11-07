// The content types that can be removed, named as reports name them.
export type RemovableContentType = "review" | "post" | "comment" | "post_comment" | "list";

// An author removal only matches the author's own row; a moderator's notice, when
// given, tells the author their content was removed and why.
export type ContentRemoval =
  | { by: "author"; userId: string }
  | { by: "moderator"; notice?: { reason: string | null; excerpt: string } };

// The user a removal is limited to, or undefined for a moderator.
export const removalOwnerId = (removal: ContentRemoval): string | undefined =>
  removal.by === "author" ? removal.userId : undefined;
