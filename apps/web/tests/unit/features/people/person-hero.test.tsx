import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { PersonHero } from "@/features/people/components/person-detail/PersonHero";
import { PersonKnownFor } from "@/features/people/components/person-detail/PersonKnownFor";
import type { PersonDetailResponse } from "@/features/people/api";

const credit = (tmdbId: number, title: string, year: number, backdropPath: string | null = null) => ({
  mediaType: "movie" as const,
  tmdbId,
  title,
  originalTitle: null,
  posterPath: null,
  backdropPath,
  releaseDate: `${year}-01-01`,
  releaseYear: year,
  character: null,
  jobs: ["Director"],
  department: "Directing",
  episodeCount: null,
  voteAverage: 7.5,
  voteCount: 1000,
});

const detail = (overrides: Partial<PersonDetailResponse["person"]> = {}): PersonDetailResponse => ({
  person: {
    tmdbPersonId: 1,
    slug: "takashi-yamazaki",
    name: "Takashi Yamazaki",
    knownForDepartment: "Directing",
    profilePath: null,
    biography: "Japanese filmmaker and visual effects supervisor.",
    biographySource: "Description above from the Wikipedia article, licensed under CC-BY-SA.",
    birthday: "1964-06-12",
    deathday: null,
    placeOfBirth: "Matsumoto, Nagano, Japan",
    popularity: 4.2,
    homepage: null,
    alsoKnownAs: [],
    roleHints: ["director"],
    externalIds: { imdbId: "nm0945724", facebookId: null, instagramId: null, twitterId: null, wikidataId: null, tiktokId: null, youtubeId: null },
    images: { profiles: [] },
    canonicalRoute: { requestedRole: "director", requestedPath: "", actorPath: "", directorPath: "", isCanonicalSlug: true },
    ...overrides,
  },
  knownFor: [credit(11, "Godzilla Minus One", 2023, "/backdrop.jpg"), credit(12, "Parasyte: Part 1", 2014)],
  credits: {
    counts: { combined: { cast: 2, crew: 51 }, movies: { cast: 2, crew: 45 }, tv: { cast: 0, crew: 6 } },
    jobCounts: [
      { job: "Director", count: 25 },
      { job: "Screenplay", count: 17 },
      { job: "VFX Supervisor", count: 9 },
      { job: "Thanks", count: 20 },
      { job: "Writer", count: 7 },
    ],
  },
});

describe("PersonHero", () => {
  it("opens with a slate, a still and the person's credits", async () => {
    renderWithProviders(<PersonHero role="director" detail={detail()} now={new Date(2026, 10, 7)} />);

    expect(await screen.findByText("Interis · Person · Director")).toBeInTheDocument();
    expect(screen.getByText("B. Jun 12 1964 · Matsumoto, Nagano, Japan")).toBeInTheDocument();
    expect(screen.getByText("Still · Godzilla Minus One · 2023")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Takashi Yamazaki" })).toBeInTheDocument();
    expect(screen.getByText("Director · Screenplay · VFX Supervisor")).toBeInTheDocument();
    expect(screen.getByText("Age").closest("div")).toHaveTextContent("62");
    expect(screen.getByRole("link", { name: /nm0945724/ })).toHaveAttribute("href", "https://www.imdb.com/name/nm0945724");
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("directed")).toBeInTheDocument();
    expect(screen.getByText(/licensed under CC-BY-SA/)).toBeInTheDocument();
  });

  it("drops filler and developer data", async () => {
    const { container } = renderWithProviders(
      <PersonHero role="director" detail={detail({ birthday: null, placeOfBirth: null, biography: null, biographySource: null })} />,
    );
    await screen.findByRole("heading", { name: "Takashi Yamazaki" });
    for (const filler of ["Unknown", "Died -", "No biography", "TMDB ID", "Popularity"]) {
      expect(container).not.toHaveTextContent(filler);
    }
  });

  it("cuts a long biography to three lines with more", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PersonHero role="director" detail={detail({ biography: "A long life story. ".repeat(40) })} />);
    await user.click(await screen.findByRole("button", { name: "more" }));
    expect(screen.getByRole("button", { name: "less" })).toBeInTheDocument();
  });
});

describe("PersonKnownFor", () => {
  it("ranks the most voted titles", async () => {
    renderWithProviders(<PersonKnownFor credits={detail().knownFor} />);
    expect(await screen.findByText("Known for · most voted on TMDB")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Godzilla Minus One/ })).toHaveAttribute("href", "/movies/11");
    expect(screen.getByText("01")).toBeInTheDocument();
  });
});
