import { logger } from "../../commons/utils/logger";
import type { AuthUser } from "../auth/types/auth.types";
import { AuthUsersRepository } from "../auth/repositories/auth-users.repository";
import {
  decodeFeedCursor,
  encodeFeedCursor,
} from "../social/helpers/social-feed-cursor.helper";
import { AdminAuditRepository } from "./repositories/admin-audit.repository";

export type AdminAuditEntry = {
  action: string;
  targetType: string;
  targetId: string;
  targetLabel?: string | null;
  reason?: string | null;
};

export class AdminAuditService {
  // Written right after the action succeeds (the Neon HTTP driver has no
  // transactions). A failed insert is logged and never undoes the action.
  static async record(actor: AuthUser, entry: AdminAuditEntry): Promise<void> {
    try {
      await AdminAuditRepository.insert({
        actorId: actor.id,
        actorUsername: actor.username,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        targetLabel: entry.targetLabel ?? null,
        reason: entry.reason ?? null,
      });
    } catch (error) {
      logger.error({ err: error, actorId: actor.id, ...entry }, "Failed to write admin audit row");
    }
  }

  static async listPage(input: { actorUsername?: string; cursor?: string; limit: number }) {
    // Filter by id so the (actor_id, created_at) index serves it.
    const actor = input.actorUsername
      ? await AuthUsersRepository.findByUsername(input.actorUsername)
      : undefined;
    if (input.actorUsername && !actor) {
      return { items: [], nextCursor: null };
    }

    const rows = await AdminAuditRepository.listPage({
      actorId: actor?.id,
      cursor: decodeFeedCursor(input.cursor),
      limit: input.limit,
    });
    const items = rows.slice(0, input.limit);
    const last = items.at(-1);

    return {
      items,
      nextCursor:
        rows.length > input.limit && last
          ? encodeFeedCursor({ createdAt: last.createdAt, id: last.id })
          : null,
    };
  }
}
