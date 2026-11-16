import { describe, expect, it } from "bun:test";
import { buildPushPayload } from "../../../src/modules/push/helpers/push-payload.helper";

describe("buildPushPayload for list invites", () => {
  it("links an invite to the inviter's list", () => {
    const payload = buildPushPayload(
      { type: "list_invite", entityId: "list-1" },
      { actorUsername: "owner", recipientUsername: "friend" },
    );
    expect(payload.body).toBe("@owner invited you to edit a list");
    expect(payload.url).toBe("/profile/owner/lists/list-1");
  });

  it("links an acceptance to the recipient's own list", () => {
    const payload = buildPushPayload(
      { type: "list_invite_accepted", entityId: "list-1" },
      { actorUsername: "friend", recipientUsername: "owner" },
    );
    expect(payload.body).toBe("@friend joined your list");
    expect(payload.url).toBe("/profile/owner/lists/list-1");
  });
});
