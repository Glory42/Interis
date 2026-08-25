import { describe, expect, it, mock } from "bun:test";

const findByUsernameMock = mock(() => Promise.resolve<{ id: string } | null>(null));
const blockUserMock = mock(() => Promise.resolve());
const deleteFollowMock = mock(() => Promise.resolve());

mock.module("../../../src/modules/users/users.service", () => ({
  UsersService: { findByUsername: findByUsernameMock },
}));
mock.module("../../../src/modules/social/repositories/social.repository", () => ({
  SocialRepository: { deleteFollow: deleteFollowMock },
}));
mock.module("../../../src/modules/moderation/repositories/moderation.repository", () => ({
  ModerationRepository: { blockUser: blockUserMock },
}));

const { ModerationService } = await import(
  "../../../src/modules/moderation/services/moderation.service"
);

describe("ModerationService.blockUser (unit)", () => {
  it("returns 404 when the target user does not exist", async () => {
    findByUsernameMock.mockResolvedValueOnce(null);

    const result = await ModerationService.blockUser("blocker-id", "ghost");

    expect(result).toEqual({ error: "User not found", status: 404 });
    expect(blockUserMock).not.toHaveBeenCalled();
  });

  it("returns 400 when blocking yourself", async () => {
    findByUsernameMock.mockResolvedValueOnce({ id: "same-id" });

    const result = await ModerationService.blockUser("same-id", "self");

    expect(result).toEqual({ error: "Cannot block yourself", status: 400 });
    expect(blockUserMock).not.toHaveBeenCalled();
  });

  it("inserts the block and severs the follow relationship in both directions", async () => {
    findByUsernameMock.mockResolvedValueOnce({ id: "target-id" });
    blockUserMock.mockClear();
    deleteFollowMock.mockClear();

    const result = await ModerationService.blockUser("blocker-id", "target");

    expect(result).toEqual({ success: true });
    expect(blockUserMock).toHaveBeenCalledWith("blocker-id", "target-id");
    expect(deleteFollowMock).toHaveBeenCalledWith("blocker-id", "target-id");
    expect(deleteFollowMock).toHaveBeenCalledWith("target-id", "blocker-id");
  });
});
