import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../../../src/infrastructure/database/db";
import { user } from "../../../src/infrastructure/database/auth.entity";
import { BadRequestError } from "../../../src/commons/errors/app-error";
import { MAX_PROFILE_TAB_OFFSET } from "../../../src/modules/users/helpers/profile-tab-page.helper";
import type { ProfileTabSurface } from "../../../src/modules/users/helpers/profile-tab-page.helper";
import {
  ProfileTabsService,
  type ProfileTab,
} from "../../../src/modules/users/services/profile-tabs.service";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser, type SignedUpTestUser } from "../../support/app/auth-flow";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";

type Case = [ProfileTab, ProfileTabSurface, Record<string, unknown>, { limit: number; offset: number }];

const LIST_TABS = ["reviews", "likes", "watchlist", "liked-reviews", "liked-lists", "lists"] as const;
const WIDGET_COLLECTION_TABS = ["reviews", "likes", "watchlist"] as const;
const PAST_CAP = String(MAX_PROFILE_TAB_OFFSET + 1);

// The whole paging contract of the Profile tabs, served through the module's interface.
const CASES: Case[] = [
  ...LIST_TABS.flatMap((tab): Case[] => [
    [tab, "app", {}, { limit: 60, offset: 0 }],
    [tab, "app", { limit: "500", offset: "7" }, { limit: 100, offset: 7 }],
    [tab, "app", { limit: "abc", offset: "-3" }, { limit: 60, offset: 0 }],
    [tab, "app", { offset: String(MAX_PROFILE_TAB_OFFSET) }, { limit: 60, offset: 5000 }],
  ]),
  ...WIDGET_COLLECTION_TABS.flatMap((tab): Case[] => [
    [tab, "widget", {}, { limit: 50, offset: 0 }],
    [tab, "widget", { limit: "500", offset: "10" }, { limit: 200, offset: 0 }],
  ]),
  ["diary", "app", {}, { limit: 50, offset: 0 }],
  ["diary", "app", { limit: "999", offset: "20" }, { limit: 200, offset: 20 }],
  ["diary", "widget", { offset: PAST_CAP }, { limit: 50, offset: MAX_PROFILE_TAB_OFFSET }],
  ["recent", "app", {}, { limit: 10, offset: 0 }],
  ["recent", "widget", { limit: "50", offset: "30" }, { limit: 20, offset: 0 }],
  ["currently-watching", "app", {}, { limit: 10, offset: 0 }],
  ["currently-watching", "widget", { limit: "99" }, { limit: 30, offset: 0 }],
];

const REJECTS_PAST_CAP: ProfileTab[] = [...LIST_TABS, "diary"];

describe("Profile tabs pagination (ProfileTabsService.read)", () => {
  let testServer: RunningTestServer | null = null;
  let owner: SignedUpTestUser;
  let ownerId: string;

  beforeAll(async () => {
    testServer = await startTestServer();
    owner = await signUpTestUser(testServer.baseUrl, "tabspage");
    const [row] = await db.select({ id: user.id }).from(user).where(eq(user.username, owner.username));
    ownerId = row!.id;
  });

  afterAll(async () => {
    if (!testServer) return;
    await testServer.close();
    testServer = null;
  });

  it.each(CASES)("%s on %s with %o reads page %o", async (tab, surface, query, expected) => {
    const read = await ProfileTabsService.read(owner.username, tab, query, { surface });
    expect(read?.page).toEqual(expected);
    expect(read?.ownerId).toBe(ownerId);
  });

  it.each(REJECTS_PAST_CAP)("%s rejects an offset past the cap in the app", async (tab) => {
    const read = ProfileTabsService.read(owner.username, tab, { offset: PAST_CAP });
    await expect(read).rejects.toBeInstanceOf(BadRequestError);
  });

  it("rejects a bad offset before looking the user up", async () => {
    const read = ProfileTabsService.read("no-such-user-tabs-page", "reviews", { offset: PAST_CAP });
    await expect(read).rejects.toBeInstanceOf(BadRequestError);
  });

  it("returns null for an unknown user and no page for top4", async () => {
    expect(await ProfileTabsService.read("no-such-user-tabs-page", "diary", {})).toBeNull();
    const top4 = await ProfileTabsService.read(owner.username, "top4", {});
    expect(top4?.page).toBeNull();
    expect(top4?.data.categories.length).toBeGreaterThan(0);
  });

  it("refuses widget reads of tabs the widget API doesn't serve", async () => {
    const read = ProfileTabsService.read(owner.username, "liked-lists" as "reviews", {}, {
      surface: "widget",
    });
    await expect(read).rejects.toThrow("not served on the widget surface");
  });

  it("shows private Lists to their owner only, marking that read viewer-specific", async () => {
    const created = await apiRequest(
      testServer!.baseUrl,
      "/api/lists",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "Hidden list", isPublic: false }),
      },
      owner.jar,
    );
    expect(created.status).toBe(201);

    const asOwner = await ProfileTabsService.read(owner.username, "lists", {}, {
      resolveViewerId: async () => ownerId,
    });
    const asOther = await ProfileTabsService.read(owner.username, "lists", {}, {
      resolveViewerId: async () => "someone-else",
    });
    const anonymous = await ProfileTabsService.read(owner.username, "lists", {});

    expect(asOwner?.data).toHaveLength(1);
    expect(asOwner?.viewerSpecific).toBe(true);
    expect(asOther?.data).toHaveLength(0);
    expect(asOther?.viewerSpecific).toBe(false);
    expect(anonymous?.data).toHaveLength(0);
  });
});
