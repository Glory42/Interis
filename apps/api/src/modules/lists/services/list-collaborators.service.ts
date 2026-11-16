import { ModerationRepository } from "../../moderation/repositories/moderation.repository";
import { NotificationsService } from "../../notifications/notifications.service";
import { UsersProfileRepository } from "../../users/repositories/users-profile.repository";
import { MAX_LIST_COLLABORATORS } from "../constants/lists.constants";
import { ListCollaboratorsRepository } from "../repositories/list-collaborators.repository";
import type { ListServiceError } from "../types/lists-service.types";
import { ListAccessService } from "./list-access.service";

type Success = { success: true };

// The List Collaborator lifecycle: invite → accept (or decline) → leave or be removed.
export class ListCollaboratorsService {
  static async invite(
    listId: string,
    ownerId: string,
    username: string,
  ): Promise<{ userId: string; username: string; status: "invited" } | ListServiceError> {
    const access = await ListAccessService.requireManager(listId, ownerId);
    if ("error" in access) return access;

    const inviteeId = await UsersProfileRepository.findUserIdByUsername(username);
    if (!inviteeId) return { error: "User not found", status: 404 };
    if (inviteeId === ownerId) return { error: "You already own this list", status: 400 };

    const [existing, blocked, count] = await Promise.all([
      ListCollaboratorsRepository.findStatus(listId, inviteeId),
      ModerationRepository.isBlocked(ownerId, inviteeId),
      ListCollaboratorsRepository.countForList(listId),
    ]);
    if (blocked) return { error: "You can't invite this user", status: 403 };
    if (existing) {
      return { error: existing === "accepted" ? "Already a collaborator" : "Already invited", status: 409 };
    }
    if (count >= MAX_LIST_COLLABORATORS) {
      return { error: `Lists can have up to ${MAX_LIST_COLLABORATORS} collaborators`, status: 400 };
    }

    const inserted = await ListCollaboratorsRepository.insertInvite(
      { listId, userId: inviteeId, invitedByUserId: ownerId },
      MAX_LIST_COLLABORATORS,
    );
    if (!inserted) {
      return { error: "Couldn't invite this user, try again", status: 409 };
    }

    await NotificationsService.notify({
      recipientId: inviteeId,
      actorId: ownerId,
      type: "list_invite",
      entityId: listId,
      metadata: { listTitle: access.list.title },
    });

    return { userId: inviteeId, username, status: "invited" };
  }

  static async accept(listId: string, userId: string): Promise<Success | ListServiceError> {
    const access = await ListAccessService.resolve(listId, userId);
    if (!access) return { error: "List not found", status: 404 };
    if (access.role !== "invitee") return { error: "No pending invite", status: 404 };

    if (!(await ListCollaboratorsRepository.accept(listId, userId))) {
      return { error: "No pending invite", status: 404 };
    }

    await Promise.all([
      NotificationsService.retract({ actorId: access.list.userId, type: "list_invite", entityId: listId, recipientId: userId }),
      NotificationsService.notify({
        recipientId: access.list.userId,
        actorId: userId,
        type: "list_invite_accepted",
        entityId: listId,
        metadata: { listTitle: access.list.title },
      }),
    ]);
    return { success: true };
  }

  // Declining an invite and leaving are a user removing themselves; anyone else needs the owner.
  static async remove(listId: string, actorId: string, targetUserId: string): Promise<Success | ListServiceError> {
    const access = await ListAccessService.resolve(listId, actorId);
    if (!access) return { error: "List not found", status: 404 };

    const isSelf = actorId === targetUserId;
    if (isSelf && access.role === "owner") return { error: "The owner can't leave their own list", status: 400 };
    if (!isSelf && access.role !== "owner") return { error: "Forbidden", status: 403 };

    const removed = await ListCollaboratorsRepository.remove(listId, targetUserId);
    if (!removed) return { error: "Not a collaborator on this list", status: 404 };

    if (removed.status === "invited") {
      await NotificationsService.retract({
        actorId: access.list.userId,
        type: "list_invite",
        entityId: listId,
        recipientId: targetUserId,
      });
    }
    return { success: true };
  }
}
