import { getVapidConfig } from "../../infrastructure/push/web-push.client";
import { logger } from "../../commons/utils/logger";
import { PushSubscriptionsService } from "./services/push-subscriptions.service";
import { PushDeliveryService, type PushableNotification } from "./services/push-delivery.service";
import type { PushPreferences } from "./constants/push.constants";
import type { SubscribeBody } from "./dto/push.dto";

const inFlight = new Set<Promise<void>>();

export class PushService {
  static getPublicKey(): { enabled: boolean; publicKey: string | null } {
    const vapid = getVapidConfig();
    return { enabled: vapid !== null, publicKey: vapid?.publicKey ?? null };
  }

  static isEnabled(): boolean {
    return getVapidConfig() !== null;
  }

  static subscribe(userId: string, body: SubscribeBody, userAgent: string | undefined): Promise<void> {
    return PushSubscriptionsService.subscribe(userId, body, userAgent);
  }

  static unsubscribe(userId: string, endpoint: string): Promise<void> {
    return PushSubscriptionsService.unsubscribe(userId, endpoint);
  }

  static getPreferences(userId: string): Promise<PushPreferences> {
    return PushSubscriptionsService.getPreferences(userId);
  }

  static updatePreferences(userId: string, changes: Partial<PushPreferences>): Promise<PushPreferences> {
    return PushSubscriptionsService.updatePreferences(userId, changes);
  }

  // Fire and forget: starts on the next tick so the triggering request answers first,
  // and a failure is logged, never thrown back at it.
  static dispatchInBackground(notification: PushableNotification): void {
    if (!PushService.isEnabled()) return;

    const task = new Promise<void>((resolve) => setImmediate(resolve))
      .then(() => PushDeliveryService.deliver(notification))
      .catch((error: unknown) => {
        logger.warn({ err: error, type: notification.type }, "Push dispatch failed");
      })
      .finally(() => inFlight.delete(task));
    inFlight.add(task);
  }

  // Resolves once every dispatch started so far has settled (tests, graceful shutdown).
  static async whenIdle(): Promise<void> {
    while (inFlight.size > 0) {
      await Promise.all([...inFlight]);
    }
  }
}
