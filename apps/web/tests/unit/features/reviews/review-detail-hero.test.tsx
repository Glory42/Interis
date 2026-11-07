import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { ProfileReviewDetailHero } from "@/features/reviews/components/profile-review-detail/ProfileReviewDetailHero";
import { ProfileReviewSidebar } from "@/features/reviews/components/profile-review-detail/ProfileReviewSidebar";
import type { ReviewDetail } from "@/features/reviews/api";

const detail = (overrides: Partial<ReviewDetail> = {}): ReviewDetail => ({
  id: "r1",
  mediaType: "movie",
  content: "Dc character when someone is not happly married",
  containsSpoilers: false,
  createdAt: "2026-11-02T21:40:00",
  updatedAt: "2026-11-02T21:40:00",
  rating: 8,
  author: { id: "u1", username: "glory42", displayUsername: null, avatarUrl: null } as ReviewDetail["author"],
  media: { tmdbId: 1, title: "Clayface", posterPath: null, releaseYear: 2026, genres: [], director: "James Watkins", creator: null },
  engagement: { likeCount: 3, commentCount: 1, viewerHasLiked: false },
  ...overrides,
});

describe("ProfileReviewDetailHero", () => {
  it("opens with a slate and the credit over a duotone frame", async () => {
    renderWithProviders(
      <ProfileReviewDetailHero username="glory42" detail={detail()} displayAuthorName="glory42" authorAvatar={null} />,
    );
    expect(await screen.findByText("Review · Film · 2026")).toBeInTheDocument();
    expect(screen.getByText("WK 45")).toBeInTheDocument();
    expect(screen.getByText("Directed by James Watkins")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Clayface/ })).toBeInTheDocument();
    expect(screen.getByText("reviewed it Mon Nov 2")).toBeInTheDocument();
    expect(screen.getByText("8/10")).toBeInTheDocument();
  });

  it("drops filler when credits and score are missing", async () => {
    const { container } = renderWithProviders(
      <ProfileReviewDetailHero
        username="glory42"
        detail={detail({ rating: null, mediaType: "tv", media: { tmdbId: 2, title: "Show", posterPath: null, releaseYear: null, genres: [], director: null, creator: null } })}
        displayAuthorName="glory42"
        authorAvatar={null}
      />,
    );
    expect(await screen.findByText("Review · TV")).toBeInTheDocument();
    expect(container).not.toHaveTextContent("No additional credits");
    expect(container).not.toHaveTextContent("Unrated");
  });
});

describe("ProfileReviewSidebar", () => {
  it("is one credits block", async () => {
    renderWithProviders(<ProfileReviewSidebar detail={detail()} />);
    expect(await screen.findByText("Credits")).toBeInTheDocument();
    expect(screen.getByText("Reviewed").closest("div")).toHaveTextContent("Mon Nov 2");
    expect(screen.getByText("Rating").closest("div")).toHaveTextContent("8 / 10");
    expect(screen.getByText("Likes").closest("div")).toHaveTextContent("3");
    expect(screen.getByText("Comments").closest("div")).toHaveTextContent("1");
    expect(screen.getByRole("link", { name: "Open the film →" })).toHaveAttribute("href", "/movies/1");
  });
});
