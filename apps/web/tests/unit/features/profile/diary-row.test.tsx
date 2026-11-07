import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { DiaryRow } from "@/features/profile/components/diary/DiaryRow";
import type { DiaryRow as DiaryRowModel } from "@/features/profile/components/diary/diary-model";

const row = (overrides: Partial<DiaryRowModel> = {}): DiaryRowModel => ({
  id: "d1",
  channel: "movie",
  title: "Godzilla Minus Zero",
  posterPath: null,
  tmdbId: 7,
  releaseYear: 2026,
  createdAt: "2026-10-28",
  rating: 7.5,
  rewatch: true,
  reviewId: "r1",
  hasReview: true,
  isLiked: true,
  dateParts: { month: "OCT", day: "28", year: "2026", monthKey: "2026-10" },
  showMonthCell: true,
  dayLabel: { day: "28", weekday: "WED" },
  ...overrides,
});

describe("DiaryRow", () => {
  it("reads as a dated log line with rockets and marks", async () => {
    renderWithProviders(<DiaryRow row={row()} username="glory42" />);

    expect(await screen.findByText("28")).toBeInTheDocument();
    expect(screen.getByText("WED")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Godzilla Minus Zero/ })).toHaveAttribute("href", "/movies/7");
    expect(screen.getByText("Film · rewatch")).toBeInTheDocument();
    expect(screen.getByLabelText("7.5 of 10")).toBeInTheDocument();
    expect(screen.getByLabelText("Liked")).toBeInTheDocument();
    expect(screen.getByLabelText("Rewatch")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Review" })).toHaveAttribute("href", "/reviews/glory42/r1");
  });

  it("hides a missing year instead of showing ----", async () => {
    const { container } = renderWithProviders(
      <DiaryRow row={row({ releaseYear: null, rewatch: false, channel: "serial" })} username="glory42" />,
    );
    expect(await screen.findByText("Series")).toBeInTheDocument();
    expect(container).not.toHaveTextContent("----");
  });

  it("gives the owner ⋯ to edit the log", async () => {
    renderWithProviders(<DiaryRow row={row()} username="glory42" isOwner />);
    expect(await screen.findByRole("button", { name: "Edit log of Godzilla Minus Zero" })).toBeInTheDocument();
  });
});
