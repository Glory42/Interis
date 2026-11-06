import { describe, expect, it } from "vitest";
import { parseAdminSearch } from "@/features/admin/admin-search";

describe("parseAdminSearch", () => {
  it("keeps a valid section and report status from the URL", () => {
    expect(parseAdminSearch({ section: "users", status: "dismissed" })).toEqual({
      section: "users",
      status: "dismissed",
    });
  });

  it("falls back to pending reports for missing or unknown values", () => {
    expect(parseAdminSearch({})).toEqual({ section: "reports", status: "pending" });
    expect(parseAdminSearch({ section: "secrets", status: 7 })).toEqual({
      section: "reports",
      status: "pending",
    });
  });
});
