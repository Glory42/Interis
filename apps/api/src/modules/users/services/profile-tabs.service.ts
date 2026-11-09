import { z } from "zod";
import { AppError } from "../../../commons/errors/app-error";
import { GetUserListsQuerySchema } from "../../lists/dto/lists.dto";
import { ListsService } from "../../lists/lists.service";
import { SocialFeedService } from "../../social/services/social-feed.service";
import { TvCurrentlyWatchingService } from "../../tv/services/tv-currently-watching.service";
import { ProfileShelfQuerySchema } from "../dto/users.dto";
import {
  normalizeProfileTabPage,
  type ProfileTabPage,
  type ProfileTabPageRule,
  type ProfileTabSurface,
} from "../helpers/profile-tab-page.helper";
import { UsersLikesRepository } from "../repositories/users-likes.repository";
import {
  UsersMediaInteractionsRepository,
  type MediaInteractionFlag,
} from "../repositories/users-media-interactions.repository";
import { UsersProfileRepository } from "../repositories/users-profile.repository";
import { UsersReviewsListRepository } from "../repositories/users-reviews-list.repository";
import { ProfileDiaryService } from "./profile-diary.service";
import { ProfileTop4Service } from "./profile-top4.service";

type TabQuery = Record<string, unknown>;
type TabContext = { userId: string; viewerId: string | null; query: TabQuery };
type PagedTabContext = TabContext & { page: ProfileTabPage };
type TabRules = { app: ProfileTabPageRule; widget?: ProfileTabPageRule };

type TabDefinition =
  | { rules: null; viewerAware: boolean; load: (ctx: TabContext) => Promise<unknown> }
  | { rules: TabRules; viewerAware: boolean; load: (ctx: PagedTabContext) => Promise<unknown> };

const unpaged = <R>(load: (ctx: TabContext) => Promise<R>) => ({ rules: null, viewerAware: false, load });
const paged = <Rules extends TabRules, R>(
  rules: Rules,
  load: (ctx: PagedTabContext) => Promise<R>,
  viewerAware = false,
) => ({ rules, viewerAware, load });

const LIST_PAGE = { defaultLimit: 60, maxLimit: 100, acceptsOffset: true };
const WIDGET_COLLECTION = { defaultLimit: 50, maxLimit: 200, acceptsOffset: false };
const DIARY_PAGE = { defaultLimit: 50, maxLimit: 200, acceptsOffset: true };
const RECENT_PAGE = { defaultLimit: 10, maxLimit: 20, acceptsOffset: false };
const CURRENTLY_WATCHING_PAGE = { defaultLimit: 10, maxLimit: 30, acceptsOffset: false };

const loadShelf =
  (flag: MediaInteractionFlag) =>
  async ({ userId, page, query }: PagedTabContext) => {
    const { type, sort } = ProfileShelfQuerySchema.parse(query);
    const [items, counts] = await Promise.all([
      UsersMediaInteractionsRepository.getMediaByFlag(userId, flag, { type, sort, ...page }),
      UsersMediaInteractionsRepository.countMediaByFlag(userId, flag),
    ]);
    const total = type === "all" ? counts.movie + counts.tv : counts[type];
    return { items, total, counts };
  };

const TABS = {
  diary: paged({ app: DIARY_PAGE, widget: DIARY_PAGE }, ({ userId, page }) =>
    ProfileDiaryService.getDiary(userId, page),
  ),
  top4: unpaged(({ userId }) => ProfileTop4Service.getTop4(userId)),
  recent: paged({ app: RECENT_PAGE, widget: RECENT_PAGE }, ({ userId, page }) =>
    SocialFeedService.getUserActivityFeed(userId, page.limit),
  ),
  "currently-watching": paged(
    { app: CURRENTLY_WATCHING_PAGE, widget: CURRENTLY_WATCHING_PAGE },
    ({ userId, page }) => TvCurrentlyWatchingService.getCurrentlyWatching(userId, page.limit),
  ),
  reviews: paged({ app: LIST_PAGE, widget: WIDGET_COLLECTION }, ({ userId, page }) =>
    UsersReviewsListRepository.getReviewsWithMovies(userId, page.limit, page.offset),
  ),
  likes: paged({ app: LIST_PAGE, widget: WIDGET_COLLECTION }, loadShelf("liked")),
  watchlist: paged({ app: LIST_PAGE, widget: WIDGET_COLLECTION }, loadShelf("watchlisted")),
  "liked-reviews": paged({ app: LIST_PAGE }, ({ userId, page }) =>
    UsersLikesRepository.getLikedReviews(userId, page.limit, page.offset),
  ),
  "liked-lists": paged({ app: LIST_PAGE }, ({ userId, page }) =>
    UsersLikesRepository.getLikedLists(userId, page.limit, page.offset),
  ),
  // Viewer-aware: private Lists are visible to their owner only.
  lists: paged(
    { app: LIST_PAGE },
    async ({ userId, viewerId, page, query }) => {
      const parsed = GetUserListsQuerySchema.safeParse(query);
      if (!parsed.success) {
        throw new AppError(400, "VALIDATION_ERROR", "Validation failed", z.flattenError(parsed.error));
      }
      const { tmdbId, itemType } = parsed.data;
      return ListsService.getUserLists(userId, viewerId, tmdbId, itemType, page.limit, page.offset);
    },
    true,
  ),
} satisfies Record<string, TabDefinition>;

// Normalises the page up front (bad paging is a 400 before any DB work) and binds it to the loader.
const prepare = (tab: string, definition: TabDefinition, query: TabQuery, surface: ProfileTabSurface) => {
  if (definition.rules === null) {
    return { page: null, load: definition.load };
  }
  const rule = definition.rules[surface];
  if (!rule) {
    throw new Error(`Profile tab "${tab}" is not served on the ${surface} surface`);
  }
  const page = normalizeProfileTabPage(query, rule, surface);
  const load = definition.load;
  return { page, load: (ctx: TabContext) => load({ ...ctx, page }) };
};

export type ProfileTab = keyof typeof TABS;
export type WidgetProfileTab = {
  [T in ProfileTab]: (typeof TABS)[T]["rules"] extends { widget: ProfileTabPageRule } | null ? T : never;
}[ProfileTab];
export type ProfileTabData<T extends ProfileTab> = Awaited<ReturnType<(typeof TABS)[T]["load"]>>;

export type ProfileTabRead<T extends ProfileTab> = {
  ownerId: string;
  page: ProfileTabPage | null;
  // True when the data depends on who is looking, so it must not be served to anyone else.
  viewerSpecific: boolean;
  data: ProfileTabData<T>;
};

export type ProfileTabReadOptions = {
  surface?: ProfileTabSurface;
  // Called only for tabs whose visibility depends on the viewer.
  resolveViewerId?: () => Promise<string | null>;
};

// One read path for every tab of a Profile: username lookup, paging, visibility.
export class ProfileTabsService {
  static async read<T extends ProfileTab>(
    username: string,
    tab: T,
    query: TabQuery,
    { surface = "app", resolveViewerId }: ProfileTabReadOptions = {},
  ): Promise<ProfileTabRead<T> | null> {
    const definition: TabDefinition = TABS[tab];
    const { page, load } = prepare(tab, definition, query, surface);

    const [userId, viewerId] = await Promise.all([
      UsersProfileRepository.findUserIdByUsername(username),
      definition.viewerAware && resolveViewerId ? resolveViewerId() : null,
    ]);
    if (!userId) {
      return null;
    }

    const data = await load({ userId, viewerId, query });

    return {
      ownerId: userId,
      page,
      viewerSpecific: Boolean(definition.viewerAware) && viewerId === userId,
      data: data as ProfileTabData<T>,
    };
  }
}
