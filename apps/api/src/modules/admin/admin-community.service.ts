import { ListsService } from "../lists/lists.service";
import { SocialService } from "../social/social.service";
import type { ActivityType } from "../social/repositories/social.repository";
import { AdminAuditService, type AuditActor } from "./admin-audit.service";
import { ModeratorActionService } from "./services/moderator-action.service";
import { resolveUserId } from "./helpers/resolve-user-id.helper";

export class AdminCommunityService {
  static async listLists(username: string | undefined, limit: number, offset: number) {
    const userId = await resolveUserId(username);
    return ListsService.listAllForAdmin({ userId }, limit, offset);
  }

  static async deleteList(listId: string, actor: AuditActor) {
    return ModeratorActionService.removeContent({ type: "list", id: listId }, actor);
  }

  static async listActivities(
    filters: { username?: string; type?: ActivityType },
    limit: number,
    offset: number,
  ) {
    const userId = await resolveUserId(filters.username);
    return SocialService.listAllActivitiesForAdmin({ userId, type: filters.type }, limit, offset);
  }

  static async deleteActivity(activityId: string, actor: AuditActor) {
    const deleted = await SocialService.deleteActivityForAdmin(activityId);
    if (deleted) {
      await AdminAuditService.record(actor, { action: "activity.delete", targetType: "activity", targetId: activityId });
    }
    return deleted;
  }
}
