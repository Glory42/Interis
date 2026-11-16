import { sendWebPush } from "../../../infrastructure/push/web-push.client";
import { logger } from "../../../commons/utils/logger";
import {
  PushSubscriptionsRepository,
  type PushDeliveryTarget,
} from "../repositories/push-subscriptions.repository";
import { buildPushPayload } from "../helpers/push-payload.helper";
import {
  LAST_USED_REFRESH_MS,
  MAX_DELIVERY_FAILURES,
  PUSH_CATEGORY_BY_TYPE,
  type PushNotificationType,
} from "../constants/push.constants";

export type PushableNotification = {
  recipientId: string;
  actorId: string;
  type: PushNotificationType;
  entityId: string;
  metadata?: string;
};

type Outcome = "delivered" | "gone" | "failed";

const isGone = (statusCode: number) => statusCode === 404 || statusCode === 410;

const sendOne = async (target: PushDeliveryTarget, payload: string): Promise<Outcome> => {
  try {
    const { statusCode } = await sendWebPush(target, payload);
    if (statusCode >= 200 && statusCode < 300) return "delivered";
    if (isGone(statusCode)) return "gone";
    logger.warn({ subscriptionId: target.id, statusCode }, "Push service rejected a notification");
    return "failed";
  } catch (error) {
    logger.warn({ err: error, subscriptionId: target.id }, "Push delivery failed");
    return "failed";
  }
};

export class PushDeliveryService {
  static async deliver(notification: PushableNotification): Promise<void> {
    const targets = await PushSubscriptionsRepository.listDeliveryTargets(notification.recipientId);
    const first = targets[0];
    if (!first || first[PUSH_CATEGORY_BY_TYPE[notification.type]] === false) return;

    const users = await PushSubscriptionsRepository.findUsernames(
      [...new Set([notification.actorId, notification.recipientId])],
    );
    const usernameOf = (id: string) => users.find((row) => row.id === id)?.username ?? null;
    const payload = JSON.stringify(
      buildPushPayload(notification, {
        actorUsername: usernameOf(notification.actorId),
        recipientUsername: usernameOf(notification.recipientId),
      }),
    );

    const outcomes = await Promise.all(targets.map((target) => sendOne(target, payload)));
    await PushDeliveryService.recordOutcomes(targets, outcomes);
  }

  // Skips the write when nothing changed, so a routine delivery costs no extra round trip.
  private static async recordOutcomes(targets: PushDeliveryTarget[], outcomes: Outcome[]): Promise<void> {
    const toDelete: string[] = [];
    const toIncrement: string[] = [];
    const toRefresh: string[] = [];
    const staleBefore = Date.now() - LAST_USED_REFRESH_MS;

    targets.forEach((target, index) => {
      const outcome = outcomes[index];
      if (outcome === "gone" || (outcome === "failed" && target.failureCount + 1 >= MAX_DELIVERY_FAILURES)) {
        toDelete.push(target.id);
      } else if (outcome === "failed") {
        toIncrement.push(target.id);
      } else if (target.failureCount > 0 || target.lastUsedAt.getTime() < staleBefore) {
        toRefresh.push(target.id);
      }
    });

    await Promise.all([
      PushSubscriptionsRepository.deleteByIds(toDelete),
      PushSubscriptionsRepository.incrementFailures(toIncrement),
      PushSubscriptionsRepository.markDelivered(toRefresh),
    ]);
  }
}
