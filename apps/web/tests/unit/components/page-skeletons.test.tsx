import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { http } from "msw";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient } from "@tanstack/react-query";
import { server } from "../../support/msw/server";
import { renderWithProviders } from "../../support/render/render-with-providers";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { FilmDetailPage } from "@/features/films/components/FilmDetailPage";
import { SeriesDetailPage } from "@/features/tv/components/SeriesDetailPage";
import { SeriesSeasonPage } from "@/features/tv/components/SeriesSeasonPage";
import { PersonDetailPage } from "@/features/people/components/PersonDetailPage";
import { ProfileLayout } from "@/features/profile/layout/ProfileLayout";
import { ProfileStatsPage } from "@/features/profile/pages/ProfileStatsPage";
import { ProfileListDetailPage } from "@/features/profile/pages/ProfileListDetailPage";
import { ProfileReviewDetailPage } from "@/features/reviews/components/ProfileReviewDetailPage";
import { ListFormPage } from "@/features/lists/pages/ListFormPage";
import { FilmLogs } from "@/features/films/components/FilmLogs";
import { FeedDayList } from "@/features/feed/components/FeedDayList";
import { FeedRail } from "@/features/feed/components/FeedRail";
import { ProfileOverviewActivity } from "@/features/profile/components/overview/ProfileOverviewActivity";
import { ProfileReviewCommentsSection } from "@/features/reviews/components/profile-review-detail/ProfileReviewCommentsSection";
import { ProfileLikedPage } from "@/features/profile/pages/ProfileLikedPage";
import { ProfileListsPage } from "@/features/profile/pages/ProfileListsPage";
import type { ReviewDetail } from "@/features/reviews/api";
import { ProfileDiaryPage } from "@/features/profile/pages/ProfileDiaryPage";
import { ProfileReviewsPage } from "@/features/profile/pages/ProfileReviewsPage";
import { ProfileWatchingPage } from "@/features/profile/pages/ProfileWatchingPage";
import { FollowListDialog } from "@/features/social/components/FollowListDialog";
import { AdminPanelState } from "@/features/admin/components/AdminPanelState";
import { SettingsBlockedSection } from "@/features/settings/components/sections/SettingsBlockedSection";

const signedIn = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryClient.setQueryData(authKeys.me, { id: "u1", username: "glory42" });
  return queryClient;
};

const pages: Array<[string, ReactElement]> = [
  ["Loading film", <FilmDetailPage tmdbId={550} />],
  ["Loading show", <SeriesDetailPage tmdbId={1396} />],
  ["Loading season", <SeriesSeasonPage tmdbId={1396} seasonNumber={1} />],
  ["Loading person", <PersonDetailPage role="actor" slug="brad-pitt" />],
  ["Loading profile", <ProfileLayout username="glory42" activeTab="overview">tab</ProfileLayout>],
  ["Loading stats", <ProfileStatsPage username="glory42" />],
  ["Loading list", <ProfileListDetailPage username="glory42" listId="l1" />],
  ["Loading list", <ListFormPage mode="edit" username="glory42" listId="l1" />],
  ["Loading review", <ProfileReviewDetailPage username="glory42" reviewId="r1" />],
  ["Loading logs", <FilmLogs tmdbId={550} />],
];

describe("page skeletons", () => {
  it.each(pages)("shows a skeleton of the page while it loads (%s)", async (label, page) => {
    server.use(http.all("*/api/*", () => new Promise<never>(() => {})));
    renderWithProviders(page, { queryClient: signedIn() });

    expect(await screen.findByRole("status", { name: label })).toBeInTheDocument();
    expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
  });
});

const sections: Array<[string, ReactElement]> = [
  ["Loading feed", <FeedDayList isLoading isError={false} days={[]} />],
  ["Loading now showing", <FeedRail films={[]} shows={[]} week={null} isLoading />],
  ["Loading activity", <ProfileOverviewActivity rows={[]} isPending isError={false} />],
  [
    "Loading comments",
    <ProfileReviewCommentsSection
      detail={{ id: "r1", mediaType: "movie", engagement: { commentCount: 2 } } as unknown as ReviewDetail}
      comments={[]}
      commentsPending
      commentsError={false}
      commentDraft=""
      onCommentDraftChange={() => {}}
      addCommentPending={false}
      addCommentError={false}
      onSubmitComment={() => {}}
    />,
  ],
  ["Loading lists", <ProfileListsPage username="glory42" />],
  ["Loading diary", <ProfileDiaryPage username="glory42" />],
  ["Loading reviews", <ProfileReviewsPage username="glory42" />],
  ["Loading watching", <ProfileWatchingPage username="glory42" />],
  ["Loading followers", <FollowListDialog isOpen onClose={() => {}} mode="followers" profileUsername="glory42" isOwnProfile />],
  [
    "Loading",
    <AdminPanelState query={{ isPending: true, isError: false, data: undefined }} emptyMessage="None">
      {() => null}
    </AdminPanelState>,
  ],
  ["Loading blocked users", <SettingsBlockedSection />],
];

describe("section skeletons", () => {
  it.each(sections)("stands in for the section while it loads (%s)", async (label, section) => {
    server.use(http.all("*/api/*", () => new Promise<never>(() => {})));
    renderWithProviders(section, { queryClient: signedIn() });

    expect(await screen.findByRole("status", { name: label })).toBeInTheDocument();
    expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
  });

  it("covers every tab of the liked page", async () => {
    server.use(http.all("*/api/*", () => new Promise<never>(() => {})));
    renderWithProviders(<ProfileLikedPage username="glory42" />, { queryClient: signedIn() });
    expect(await screen.findByRole("status", { name: "Loading liked titles" })).toBeInTheDocument();
    for (const [from, to] of [["titles", "reviews"], ["reviews", "lists"]]) {
      await userEvent.click(screen.getByRole("button", { name: new RegExp(`^${from}`, "i") }));
      await userEvent.click(screen.getByRole("menuitemradio", { name: new RegExp(`^${to}`, "i") }));
      expect(await screen.findByRole("status", { name: `Loading liked ${to}` })).toBeInTheDocument();
      expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
    }
  });
});
