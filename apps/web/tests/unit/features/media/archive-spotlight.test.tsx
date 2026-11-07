import { useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { toWeekLabel } from "@/features/media/archive/week-label";
import { ArchiveSpotlight } from "@/features/media/archive/ArchiveSpotlight";
import { ArchiveFilterControls } from "@/features/media/archive/ArchiveFilterControls";
import { FILM_MODULE_STYLES } from "@/features/media/styles";
import type { ArchiveMenuKey } from "@/features/media/types";

describe("toWeekLabel", () => {
  it("names the ISO week and its Monday-to-Sunday dates", () => {
    expect(toWeekLabel(new Date(2026, 10, 6))).toBe("WK 45 · NOV 2–8");
  });

  it("spells out both months when the week crosses one", () => {
    expect(toWeekLabel(new Date(2026, 9, 28))).toBe("WK 44 · OCT 26 – NOV 1");
  });
});

const spotlightItems = [
  { tmdbId: 550, title: "Fight Club", year: 1999, credit: "Directed by David Fincher", backdropUrl: "/a.jpg", tmdbRating: 8.4 },
  { tmdbId: 680, title: "Pulp Fiction", year: 1994, credit: "Directed by Quentin Tarantino", backdropUrl: "/b.jpg", tmdbRating: 8.5 },
  { tmdbId: 13, title: "Forrest Gump", year: 1994, credit: null, backdropUrl: "/c.jpg", tmdbRating: null },
];

describe("ArchiveSpotlight", () => {
  it("keeps the reel's frame as a skeleton while the titles load", async () => {
    renderWithProviders(
      <ArchiveSpotlight kindLabel="Films" modeLabel="Trending" tone="film" detailRoute="/movies/$tmdbId" items={[]} isLoading now={new Date(2026, 10, 6)} />,
    );

    const reel = await screen.findByRole("status", { name: "Loading trending films" });
    expect(reel).toHaveTextContent("Interis · Films · Trending");
    expect(reel).toHaveTextContent("WK 45 · NOV 2–8");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("frames the first title like a reel, linking to it", async () => {
    renderWithProviders(
      <ArchiveSpotlight
        kindLabel="Films"
        modeLabel="Trending"
        tone="film"
        detailRoute="/movies/$tmdbId"
        items={spotlightItems}
        now={new Date(2026, 10, 6)}
      />,
    );

    expect(await screen.findByText("Interis · Films · Trending")).toBeInTheDocument();
    expect(screen.getByText("WK 45 · NOV 2–8")).toBeInTheDocument();
    expect(screen.getByText("Directed by David Fincher")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Fight Club/ })).toHaveAttribute("href", "/movies/550");
    expect(screen.getByText("Reel 01/03 · TMDB 8.4")).toBeInTheDocument();
  });

  it("jumps to another title from the reel ticks", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ArchiveSpotlight
        kindLabel="Films"
        modeLabel="Trending"
        tone="film"
        detailRoute="/movies/$tmdbId"
        items={spotlightItems}
        now={new Date(2026, 10, 6)}
      />,
    );

    await user.click(await screen.findByRole("button", { name: "Show 2 of 3" }));
    expect(screen.getByRole("link", { name: /Pulp Fiction/ })).toHaveAttribute("href", "/movies/680");
    expect(screen.getByText("Reel 02/03 · TMDB 8.5")).toBeInTheDocument();
  });

  it("shows nothing without titles to feature", async () => {
    const { container } = render(
      <ArchiveSpotlight kindLabel="Films" modeLabel="Trending" tone="film" detailRoute="/movies/$tmdbId" items={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

const sortOptions = [
  { value: "trending", label: "Trending" },
  { value: "release_desc", label: "Newest release" },
] as const;
const periodOptions = [{ value: "this_year", label: "This year" }] as const;
const languageOptions = [
  { value: "all", label: "All languages" },
  { value: "ja", label: "Japanese" },
];

const FilterSentence = ({
  sort,
  onSelectSort,
}: {
  sort: "trending" | "release_desc";
  onSelectSort: (sort: "trending" | "release_desc") => void;
}) => {
  const controlsRef = useRef<HTMLDivElement | null>(null);
  const [openMenu, setOpenMenu] = useState<ArchiveMenuKey | null>(null);
  return (
    <ArchiveFilterControls
      controlsRef={controlsRef}
      openMenu={openMenu}
      onBlurCapture={() => {}}
      onToggleMenu={(menu) => setOpenMenu((current) => (current === menu ? null : menu))}
      onCloseMenu={() => setOpenMenu(null)}
      selectedGenre="all"
      selectedLanguage="all"
      selectedSort={sort}
      selectedPeriod="this_year"
      isPeriodDisabled={sort === "trending"}
      availableGenres={[{ name: "Drama" }]}
      sortOptions={sortOptions}
      periodOptions={periodOptions}
      languageOptions={languageOptions}
      onSelectGenre={vi.fn()}
      onSelectSort={onSelectSort}
      onSelectLanguage={vi.fn()}
      onSelectPeriod={vi.fn()}
      moduleStyles={FILM_MODULE_STYLES}
    />
  );
};

describe("ArchiveFilterControls", () => {
  it("reads as a sentence", () => {
    const { container } = render(<FilterSentence sort="trending" onSelectSort={vi.fn()} />);
    expect(container).toHaveTextContent("Showing every genre, trending, in any language.");
  });

  it("adds the period once the sort uses one", () => {
    const { container } = render(<FilterSentence sort="release_desc" onSelectSort={vi.fn()} />);
    expect(container).toHaveTextContent("Showing every genre, newest release, this year, in any language.");
  });

  it("opens a menu from a word in the sentence", async () => {
    const user = userEvent.setup();
    const onSelectSort = vi.fn();
    render(<FilterSentence sort="trending" onSelectSort={onSelectSort} />);

    await user.click(screen.getByRole("button", { name: /trending/ }));
    await user.click(screen.getByRole("menuitemradio", { name: "Newest release" }));
    expect(onSelectSort).toHaveBeenCalledWith("release_desc");
  });
});
