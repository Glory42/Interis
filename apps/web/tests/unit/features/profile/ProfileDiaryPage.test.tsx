import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { ProfileDiaryPage } from "@/features/profile/pages/ProfileDiaryPage";

const diaryItem = (id: string, title: string, mediaType: "movie" | "tv", tags: string[] = []) => ({
  id,
  mediaType,
  watchedDate: "2026-04-05",
  rating: null,
  rewatch: false,
  liked: false,
  createdAt: "2026-04-05T10:00:00.000Z",
  updatedAt: "2026-04-05T10:00:00.000Z",
  media: { tmdbId: Number(id), title, posterPath: null, releaseYear: 2020 },
  review: null,
  tags,
});

describe("ProfileDiaryPage", () => {
  it("filters the loaded logs by media type", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("http://localhost/api/users/cinephile/diary", () =>
        HttpResponse.json([
          diaryItem("1", "Film Log", "movie"),
          diaryItem("2", "Show Log", "tv"),
        ]),
      ),
    );

    const { container } = renderWithProviders(<ProfileDiaryPage username="cinephile" />);

    expect(await screen.findAllByText("Film Log")).not.toHaveLength(0);
    expect(screen.getAllByText("Show Log")).not.toHaveLength(0);
    expect(container).toHaveTextContent("Showing all 2 logs · films and series.");

    await user.click(screen.getByRole("button", { name: "Filter diary by media type" }));
    await user.click(screen.getByRole("menuitemradio", { name: "Series" }));

    expect(await screen.findAllByText("Show Log")).not.toHaveLength(0);
    expect(screen.queryByText("Film Log")).not.toBeInTheDocument();
  });

  it("does not render diary tags or a tag filter", async () => {
    server.use(
      http.get("http://localhost/api/users/cinephile/diary", () =>
        HttpResponse.json([diaryItem("1", "Tagged Film", "movie", ["cinema", "with mom"])]),
      ),
    );

    renderWithProviders(<ProfileDiaryPage username="cinephile" />);

    expect(await screen.findAllByText("Tagged Film")).not.toHaveLength(0);
    expect(screen.queryByText("Tags")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /#cinema/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /#with mom/ })).not.toBeInTheDocument();
  });

  it("shows the empty state when nothing is logged", async () => {
    server.use(http.get("http://localhost/api/users/cinephile/diary", () => HttpResponse.json([])));

    renderWithProviders(<ProfileDiaryPage username="cinephile" />);

    expect(await screen.findByText("cinephile hasn't logged anything yet.")).toBeInTheDocument();
  });
});
