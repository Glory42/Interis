import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { ProfileReviewRow } from "@/features/profile/components/ProfileReviewRow";
import type { UserReview } from "@/features/profile/api";

const review = (overrides: Partial<UserReview> = {}): UserReview => ({
  id: "r1",
  content: "Dc character when someone is not happly married",
  containsSpoilers: false,
  rating: 8,
  createdAt: "2026-11-02T21:40:00",
  updatedAt: "2026-11-02T21:40:00",
  tmdbId: 1,
  title: "Clayface",
  posterPath: null,
  releaseYear: 2026,
  mediaType: "movie",
  ...overrides,
});

describe("ProfileReviewRow", () => {
  it("sets the review as a quote under a dated kicker", async () => {
    renderWithProviders(<ProfileReviewRow review={review()} username="glory42" />);

    expect(await screen.findByText("Film · reviewed Mon Nov 2 · WK 45")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Clayface/ })).toHaveAttribute("href", "/movies/1");
    expect(screen.getByLabelText("8 of 10")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "“Dc character when someone is not happly married”" })).toHaveAttribute("href", "/reviews/glory42/r1");
    expect(screen.getByRole("link", { name: "Read →" })).toHaveAttribute("href", "/reviews/glory42/r1");
  });

  it("keeps spoilers behind a reveal", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ProfileReviewRow review={review({ containsSpoilers: true, content: "Snape kills Dumbledore" })} username="glory42" />,
    );
    expect(screen.queryByText(/Snape/)).not.toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: "⚠ Spoilers · reveal" }));
    expect(screen.getByText(/Snape kills Dumbledore/)).toBeInTheDocument();
  });

  it("names TV and never shows Unknown for a bad date", async () => {
    const { container } = renderWithProviders(
      <ProfileReviewRow review={review({ mediaType: "tv", createdAt: "nope", tmdbId: 1396, title: "Breaking Bad" })} username="glory42" />,
    );
    expect(await screen.findByText("Series · reviewed")).toBeInTheDocument();
    expect(container).not.toHaveTextContent("Unknown");
  });
});
