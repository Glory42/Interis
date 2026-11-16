import { isUuid } from "../../../commons/helpers/uuid.helper";
import {
  canEditEntries,
  canManageList,
  canViewList,
  resolveListRole,
  type ListRole,
} from "../helpers/list-access.policy";
import { ListCollaboratorsRepository } from "../repositories/list-collaborators.repository";
import { ListsReadRepository } from "../repositories/lists-read.repository";
import type { ListServiceError } from "../types/lists-service.types";

type ListRow = NonNullable<Awaited<ReturnType<typeof ListsReadRepository.findById>>>;
export type ListAccess = { list: ListRow; role: ListRole };

const NOT_FOUND: ListServiceError = { error: "List not found", status: 404 };
const FORBIDDEN: ListServiceError = { error: "Forbidden", status: 403 };

// Loads a List with the viewer's role on it; every permission check goes through here.
export class ListAccessService {
  static async resolve(listId: string, viewerId: string | null | undefined): Promise<ListAccess | null> {
    if (!isUuid(listId)) return null;

    const [list, status] = await Promise.all([
      ListsReadRepository.findById(listId),
      viewerId ? ListCollaboratorsRepository.findStatus(listId, viewerId) : null,
    ]);
    if (!list) return null;

    return { list, role: resolveListRole(list, viewerId, status) };
  }

  static async resolveVisible(listId: string, viewerId: string | null | undefined): Promise<ListAccess | null> {
    const access = await ListAccessService.resolve(listId, viewerId);
    return access && canViewList(access.list, access.role) ? access : null;
  }

  // The gate for every List Entry write: add, remove, reorder, note.
  static async requireEntryEditor(listId: string, userId: string): Promise<ListAccess | ListServiceError> {
    const access = await ListAccessService.resolve(listId, userId);
    if (!access) return NOT_FOUND;
    return canEditEntries(access.role) ? access : FORBIDDEN;
  }

  static async requireManager(listId: string, userId: string): Promise<ListAccess | ListServiceError> {
    const access = await ListAccessService.resolve(listId, userId);
    if (!access) return NOT_FOUND;
    return canManageList(access.role) ? access : FORBIDDEN;
  }
}
