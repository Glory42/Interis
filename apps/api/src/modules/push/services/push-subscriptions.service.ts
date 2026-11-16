import { PushSubscriptionsRepository } from "../repositories/push-subscriptions.repository";
import { PushPreferencesRepository } from "../repositories/push-preferences.repository";
import {
  DEFAULT_PUSH_PREFERENCES,
  MAX_SUBSCRIPTIONS_PER_USER,
  type PushPreferences,
} from "../constants/push.constants";
import type { SubscribeBody } from "../dto/push.dto";

const MAX_USER_AGENT_LENGTH = 255;

export class PushSubscriptionsService {
  static async subscribe(userId: string, body: SubscribeBody, userAgent: string | undefined): Promise<void> {
    await PushSubscriptionsRepository.upsert({
      userId,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      userAgent: userAgent ? userAgent.slice(0, MAX_USER_AGENT_LENGTH) : null,
    });
    await PushSubscriptionsRepository.pruneBeyond(userId, MAX_SUBSCRIPTIONS_PER_USER);
  }

  static async unsubscribe(userId: string, endpoint: string): Promise<void> {
    await PushSubscriptionsRepository.deleteForUser(userId, endpoint);
  }

  static async getPreferences(userId: string): Promise<PushPreferences> {
    return (await PushPreferencesRepository.find(userId)) ?? DEFAULT_PUSH_PREFERENCES;
  }

  static async updatePreferences(userId: string, changes: Partial<PushPreferences>): Promise<PushPreferences> {
    return PushPreferencesRepository.upsert(userId, changes);
  }
}
