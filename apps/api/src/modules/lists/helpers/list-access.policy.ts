// The one rule set for who may do what with a List (see List Collaborator in CONTEXT.md).
export type CollaboratorStatus = "invited" | "accepted";
export type ListRole = "owner" | "collaborator" | "invitee" | "none";

export const resolveListRole = (
  list: { userId: string },
  viewerId: string | null | undefined,
  collaboratorStatus: CollaboratorStatus | null,
): ListRole => {
  if (!viewerId) return "none";
  if (list.userId === viewerId) return "owner";
  if (collaboratorStatus === "accepted") return "collaborator";
  if (collaboratorStatus === "invited") return "invitee";
  return "none";
};

// Add, remove, reorder List Entries and edit their notes.
export const canEditEntries = (role: ListRole): boolean => role === "owner" || role === "collaborator";

// Rename, change visibility or ranking, delete, and manage collaborators.
export const canManageList = (role: ListRole): boolean => role === "owner";

// Invitees can preview a private list so they know what they're accepting.
export const canViewList = (list: { isPublic: boolean }, role: ListRole): boolean =>
  list.isPublic || role !== "none";
