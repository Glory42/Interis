import { ListsService } from "../lists/lists.service";
import { SocialService } from "../social/social.service";
import type { ActivityType } from "../social/repositories/social.repository";
import { AuthUsersRepository } from "../auth/repositories/auth-users.repository";

const resolveUserId = async (username: string | undefined): Promise<string | undefined> => {
  if (!username) return undefined;
  const userRow = await AuthUsersRepository.findByUsername(username);
  return userRow?.id;
};

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
