import { describe, expect, it, mock } from "bun:test";

const insertMock = mock(() => Promise.resolve());

mock.module("../../../src/modules/notifications/repositories/notifications.repository", () => ({
  NotificationsRepository: { insert: insertMock },
}));

const { NotificationsService } = await import(
  "../../../src/modules/notifications/notifications.service"
);

describe("NotificationsService.notify (unit)", () => {
  it("is a no-op when the actor and recipient are the same user", async () => {
    insertMock.mockClear();

    await NotificationsService.notify({
      recipientId: "user-1",
      actorId: "user-1",
      type: "like_review",
      entityId: "review-1",
    });

    expect(insertMock).not.toHaveBeenCalled();
  });

  it("inserts a notification for a different actor", async () => {
    insertMock.mockClear();

    await NotificationsService.notify({
      recipientId: "user-1",
      actorId: "user-2",
      type: "follow",
      entityId: "user-2",
    });

    expect(insertMock).toHaveBeenCalledWith({
      recipientId: "user-1",
      actorId: "user-2",
      type: "follow",
      entityId: "user-2",
      metadata: undefined,
    });
  });

  it("JSON-stringifies metadata when provided", async () => {
    insertMock.mockClear();

    await NotificationsService.notify({
      recipientId: "user-1",
      actorId: "user-2",
      type: "comment_post",
      entityId: "post-1",
      metadata: { postId: "post-1" },
    });

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: JSON.stringify({ postId: "post-1" }) }),
    );
  });
});
