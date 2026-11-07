import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { PersonDetailPage } from "@/features/people/components/PersonDetailPage";

const person = {
  tmdbPersonId: 525,
  slug: "christopher-nolan",
  name: "Christopher Nolan",
  knownForDepartment: "Directing",
  profilePath: null,
  biography: "A director.",
  biographySource: "From Wikipedia, the free encyclopedia",
  birthday: null,
  deathday: null,
  placeOfBirth: null,
  popularity: null,
  homepage: null,
  alsoKnownAs: [],
  roleHints: ["director"],
  externalIds: {
    imdbId: null,
    facebookId: null,
    instagramId: null,
    twitterId: null,
    wikidataId: null,
    tiktokId: null,
    youtubeId: null,
  },
  images: { profiles: [] },
  canonicalRoute: {
    requestedRole: "director",
    requestedPath: "/director/christopher-nolan",
    actorPath: "/actor/christopher-nolan",
    directorPath: "/director/christopher-nolan",
    isCanonicalSlug: true,
  },
};

const credit = (tmdbId: number, jobs: string[]) => ({
  mediaType: "movie",
  tmdbId,
  title: `Film ${tmdbId}`,
  originalTitle: null,
  posterPath: null,
  backdropPath: null,
  releaseDate: null,
  releaseYear: 2020,
  character: null,
  jobs,
  department: "Directing",
  episodeCount: null,
  voteAverage: null,
  voteCount: null,
});

describe("PersonDetailPage", () => {
  it("shows server totals and loads the next page of credits", async () => {
    const user = userEvent.setup();
    const offsets: (string | null)[] = [];
    server.use(
      http.get("http://localhost/api/people/director/christopher-nolan", () =>
        HttpResponse.json({
          person,
          credits: {
            counts: {
              combined: { cast: 2, crew: 41 },
              movies: { cast: 2, crew: 41 },
              tv: { cast: 0, crew: 0 },
            },
            jobCounts: [{ job: "Director", count: 41 }],
          },
        }),
      ),
      http.get("http://localhost/api/people/director/christopher-nolan/credits", ({ request }) => {
        const params = new URL(request.url).searchParams;
        offsets.push(params.get("offset"));
        const items =
          params.get("offset") === "40"
            ? [credit(41, ["Director"])]
            : Array.from({ length: 40 }, (_, index) =>
                credit(index + 1, index === 0 ? ["Director", "Writer"] : ["Director"]),
              );
        return HttpResponse.json({ items, total: 41 });
      }),
    );

    renderWithProviders(<PersonDetailPage role="director" slug="christopher-nolan" />);

    expect(await screen.findByRole("button", { name: "Crew (41)" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Christopher Nolan" })).toBeInTheDocument();
    expect(screen.getByText("From Wikipedia, the free encyclopedia")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Combined (43)" })).toBeInTheDocument();
    expect(await screen.findByText("Director, Writer")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Load more credits" }));

    expect(await screen.findByText("Film 41")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Load more credits" })).not.toBeInTheDocument();
    expect(offsets).toEqual(["0", "40"]);
  });
});
