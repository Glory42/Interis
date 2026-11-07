import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient } from "@tanstack/react-query";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { PostActivityDialogCommentsList } from "@/features/feed/components/post-activity-dialog/PostActivityDialogCommentsList";
import { ProfileReviewCommentsSection } from "@/features/reviews/components/profile-review-detail/ProfileReviewCommentsSection";
import { ProfileListDetailPage } from "@/features/profile/pages/ProfileListDetailPage";
import type { ReviewDetail } from "@/features/reviews/api";

const signedInAs = (id: string, username: string) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  queryClient.setQueryData(authKeys.me, { id, username });
  return queryClient;
};

const comment = (userId: string) => ({
  id: `c-${userId}`,
  userId,
  content: `Said by ${userId}`,
  createdAt: "2026-11-01T10:00:00.000Z",
  updatedAt: "2026-11-01T10:00:00.000Z",
  authorUsername: userId,
  authorDisplayUsername: null,
  authorAvatarUrl: null,
});

const captureReport = () => {
  const received: unknown[] = [];
  server.use(
    http.post("*/api/reports", async ({ request }) => {
      received.push(await request.json());
      return HttpResponse.json({ success: true }, { status: 201 });
    }),
  );
  return received;
};

describe("reporting a comment on a post", () => {
  it("offers Report on other people's comments only, and files it as a post comment", async () => {
    const user = userEvent.setup();
    const received = captureReport();
    renderWithProviders(
      <PostActivityDialogCommentsList
        postId="p1"
        comments={[{ ...comment("me"), postId: "p1" }, { ...comment("them"), postId: "p1" }]}
        isPending={false}
        isError={false}
      />,
      { queryClient: signedInAs("me", "me") },
    );

    const reportButtons = await screen.findAllByRole("button", { name: "Report comment" });
    expect(reportButtons).toHaveLength(1);
    await user.click(reportButtons[0]!);

    expect(screen.getByText("Report comment")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "submit report" }));
    await screen.findByText("Thanks — this has been reported for review.");
    expect(received[0]).toMatchObject({ targetType: "post_comment", targetId: "c-them" });
  });
});

describe("reporting a comment on a review", () => {
  it("files it as a review comment", async () => {
    const user = userEvent.setup();
    const received = captureReport();
    const detail = { id: "r1", mediaType: "movie", engagement: { commentCount: 1 } } as unknown as ReviewDetail;
    renderWithProviders(
      <ProfileReviewCommentsSection
        detail={detail}
        comments={[{ ...comment("them"), reviewId: "r1" }]}
        commentsPending={false}
        commentsError={false}
        commentDraft=""
        onCommentDraftChange={() => {}}
        addCommentPending={false}
        addCommentError={false}
        onSubmitComment={() => {}}
      />,
      { queryClient: signedInAs("me", "me") },
    );

    await user.click(await screen.findByRole("button", { name: "Report comment" }));
    await user.click(screen.getByRole("button", { name: "submit report" }));
    await screen.findByText("Thanks — this has been reported for review.");
    expect(received[0]).toMatchObject({ targetType: "comment", targetId: "c-them" });
  });
});

describe("reporting a list", () => {
  const listDetail = {
    id: "l1",
    userId: "owner",
    title: "Bad list",
    description: null,
    isRanked: false,
    isPublic: true,
    derivedType: null,
    createdAt: "2026-10-01T10:00:00.000Z",
    updatedAt: "2026-11-01T10:00:00.000Z",
    itemCount: 0,
    likeCount: 0,
    likedByViewer: false,
    items: [],
  };

  it("lets someone else report the list from its ⋯ menu", async () => {
    const user = userEvent.setup();
    const received = captureReport();
    server.use(http.get("*/api/lists/l1", () => HttpResponse.json(listDetail)));
    renderWithProviders(<ProfileListDetailPage username="owner" listId="l1" />, { queryClient: signedInAs("me", "me") });

    await user.click(await screen.findByRole("button", { name: "List actions" }));
    expect(screen.queryByRole("menuitem", { name: "Delete" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: "Report list" }));

    expect(screen.getByText("Report list")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "submit report" }));
    await screen.findByText("Thanks — this has been reported for review.");
    expect(received[0]).toMatchObject({ targetType: "list", targetId: "l1" });
  });
});
