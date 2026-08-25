import { ListsService } from "../lists/lists.service";
import { SocialService } from "../social/social.service";
import type { ActivityType } from "../social/repositories/social.repository";
import { resolveUserId } from "./helpers/resolve-user-id.helper";

export class AdminCommunityService {
  static async listLists(username: string | undefined, limit: number, offset: number) {
    const userId = await resolveUserId(username);
    return ListsService.listAllForAdmin({ userId }, limit, offset);
  }

  static async deleteList(listId: string) {
    return ListsService.deleteForAdmin(listId);
  }

  static async listActivities(
    filters: { username?: string; type?: ActivityType },
    limit: number,
    offset: number,
  ) {
    const userId = await resolveUserId(filters.username);
    return SocialService.listAllActivitiesForAdmin({ userId, type: filters.type }, limit, offset);
  }

  static async deleteActivity(activityId: string) {
    return SocialService.deleteActivityForAdmin(activityId);
  }
}
