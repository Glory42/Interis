import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { MediaDetailsMainSection } from "@/features/media/detail/MediaDetailsMainSection";
import { MOVIE_MODULE_STYLES } from "@/features/media/styles";

const person = (tmdbPersonId: number, name: string, character: string | null = null) => ({
  tmdbPersonId,
  slug: name.toLowerCase().replace(/ /g, "-"),
  name,
  profilePath: null,
  knownForDepartment: "Acting",
  routeRole: "actor" as const,
  character,
  job: null,
  department: null,
});

const baseProps = {
  moduleStyles: MOVIE_MODULE_STYLES,
  title: "Clayface",
  genres: [
    { id: 1, name: "Horror" },
    { id: 2, name: "Thriller" },
  ],
  creditRoleLabel: "Directed by",
  communityRatingLabel: "8.0",
  logsCount: 1,
  tmdbRatingLabel: "7.4",
  overview: "Matt Hagen's rise is cut short.",
  overviewFallback: "No synopsis.",
  ratingBuckets: [],
};

describe("MediaDetailsMainSection", () => {
  it("reads like an opening credit: director, title, tagline and one score line", async () => {
    renderWithProviders(
      <MediaDetailsMainSection
        {...baseProps}
        creditPeople={[person(10, "James Watkins")]}
        tagline="Some faces should stay buried."
        cast={[]}
        factRows={[]}
      />,
    );

    expect(await screen.findByRole("link", { name: "James Watkins" })).toBeInTheDocument();
    expect(screen.getByText("Directed by")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Clayface" })).toBeInTheDocument();
    expect(screen.getByText("Some faces should stay buried.")).toBeInTheDocument();
    expect(screen.getByText("Horror / Thriller")).toBeInTheDocument();
  });

  it("puts the runtime on the score line under the title, and phone actions right after it", async () => {
    renderWithProviders(
      <MediaDetailsMainSection
        {...baseProps}
        creditPeople={[]}
        tagline={null}
        cast={[]}
        factRows={[]}
        runtimeLabel="2h 15min"
        actionsSlot={<button type="button">Log</button>}
      />,
    );

    const scoreLine = await screen.findByRole("list", { name: "At a glance" });
    expect(scoreLine).toHaveTextContent("2h 15min");
    const log = screen.getByRole("button", { name: "Log" });
    expect(scoreLine.compareDocumentPosition(log) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(log.compareDocumentPosition(screen.getByText("Matt Hagen's rise is cut short.")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("never shows Unknown: missing credits and facts simply don't appear", async () => {
    renderWithProviders(
      <MediaDetailsMainSection
        {...baseProps}
        creditPeople={[]}
        tagline={null}
        cast={[]}
        factRows={[
          { label: "Runtime", value: "1h 49m" },
          { label: "Budget", value: null },
        ]}
      />,
    );

    await screen.findByRole("heading", { level: 1, name: "Clayface" });
    expect(screen.queryByText("Directed by")).not.toBeInTheDocument();
    expect(screen.queryByText(/Unknown/)).not.toBeInTheDocument();
    expect(screen.getByText("Runtime")).toBeInTheDocument();
    expect(screen.queryByText("Budget")).not.toBeInTheDocument();
  });

  it("lists cast as character and actor, three at first, with the rest behind + more", async () => {
    renderWithProviders(
      <MediaDetailsMainSection
        {...baseProps}
        creditPeople={[]}
        tagline={null}
        cast={[
          person(1, "Tom Rhys Harries", "Matt Hagen / Clayface"),
          person(2, "Naomi Ackie", "Caitlyn Corr"),
          person(3, "Eddie Marsan", "Frank Fitzpatrick"),
          person(4, "Fourth Actor", "Fourth"),
          person(5, "Fifth Actor", null),
        ]}
        factRows={[]}
      />,
    );

    expect(await screen.findByText("Matt Hagen / Clayface")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tom Rhys Harries" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Fourth Actor" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "+ 2 more cast" }));
    expect(screen.getByRole("link", { name: "Fourth Actor" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Fifth Actor" })).toBeInTheDocument();
  });
});
