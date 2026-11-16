import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen } from "@testing-library/react";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { ProfileDiaryPage } from "@/features/profile/pages/ProfileDiaryPage";

const diaryItem = (id: string, title: string, tags: string[]) => ({
  id,
  mediaType: "movie",
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

describe("ProfileDiaryPage tags", () => {
  it("asks the server for one tag and lists the user's tags with counts", async () => {
    const requested: (string | null)[] = [];
    server.use(
      http.get("http://localhost/api/users/cinephile/diary", ({ request }) => {
        requested.push(new URL(request.url).searchParams.get("tag"));
        return HttpResponse.json([diaryItem("1", "Tagged Film", ["cinema", "with mom"])]);
      }),
      http.get("http://localhost/api/users/cinephile/diary/tags", () =>
        HttpResponse.json([
          { tag: "cinema", count: 4 },
          { tag: "with mom", count: 2 },
        ]),
      ),
    );

    renderWithProviders(<ProfileDiaryPage username="cinephile" tag="cinema" />);

    expect((await screen.findAllByText("Tagged Film")).length).toBeGreaterThan(0);
    expect(requested).toEqual(["cinema"]);
    expect(screen.getByText("Logs tagged")).toHaveTextContent("Logs tagged #cinema");
    expect(screen.getByRole("link", { name: "Show all" })).toHaveAttribute("href", "/profile/cinephile/diary");

    const active = await screen.findByRole("link", { name: "#cinema, 4 logs" });
    // The active tag clears the filter; the others switch to themselves.
    expect(active).toHaveAttribute("aria-current", "true");
    expect(active).toHaveAttribute("href", "/profile/cinephile/diary");
    expect(screen.getByRole("link", { name: "#with mom, 2 logs" })).toHaveAttribute(
      "href",
      "/profile/cinephile/diary?tag=with+mom",
    );
    // Each row links its own tags to the filter too.
    expect(screen.getAllByRole("link", { name: "#with mom" })[0]).toHaveAttribute(
      "href",
      "/profile/cinephile/diary?tag=with+mom",
    );
  });

  it("says when nothing carries the tag", async () => {
    server.use(http.get("http://localhost/api/users/cinephile/diary", () => HttpResponse.json([])));

    renderWithProviders(<ProfileDiaryPage username="cinephile" tag="nothing" />);

    expect(await screen.findByText("Nothing logged with #nothing.")).toBeInTheDocument();
  });
});
