import { describe, expect, it } from "bun:test";
import {
  canEditEntries,
  canManageList,
  canViewList,
  resolveListRole,
  type ListRole,
} from "../../../src/modules/lists/helpers/list-access.policy";

const list = { userId: "owner" };

describe("list access policy", () => {
  it("resolves the viewer's role on a list", () => {
    expect(resolveListRole(list, "owner", null)).toBe("owner");
    expect(resolveListRole(list, "u1", "accepted")).toBe("collaborator");
    expect(resolveListRole(list, "u1", "invited")).toBe("invitee");
    expect(resolveListRole(list, "u1", null)).toBe("none");
    expect(resolveListRole(list, null, null)).toBe("none");
  });

  const table: Array<[ListRole, { edit: boolean; manage: boolean; seePrivate: boolean }]> = [
    ["owner", { edit: true, manage: true, seePrivate: true }],
    ["collaborator", { edit: true, manage: false, seePrivate: true }],
    ["invitee", { edit: false, manage: false, seePrivate: true }],
    ["none", { edit: false, manage: false, seePrivate: false }],
  ];

  for (const [role, expected] of table) {
    it(`${role}: edit entries ${expected.edit}, manage ${expected.manage}, see private ${expected.seePrivate}`, () => {
      expect(canEditEntries(role)).toBe(expected.edit);
      expect(canManageList(role)).toBe(expected.manage);
      expect(canViewList({ isPublic: false }, role)).toBe(expected.seePrivate);
      expect(canViewList({ isPublic: true }, role)).toBe(true);
    });
  }
});
