import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Slate } from "@/components/film/Slate";
import { CreditsList } from "@/components/film/CreditsList";
import { OutlinedRank } from "@/components/film/OutlinedRank";
import { ReelCells } from "@/components/film/ReelCells";

describe("film basics", () => {
  it("lays out a slate's left and right labels", () => {
    render(<Slate left={["Film", "2026"]} right={["1h 49m"]} />);

    expect(screen.getByText("Film · 2026")).toBeInTheDocument();
    expect(screen.getByText("1h 49m")).toBeInTheDocument();
  });

  it("drops credit rows that have no value", () => {
    render(
      <CreditsList
        rows={[
          { label: "Directed by", value: "James Watkins" },
          { label: "Written by", value: null },
          { label: "Music", value: "" },
        ]}
      />,
    );

    expect(screen.getByText("Directed by")).toBeInTheDocument();
    expect(screen.getByText("James Watkins")).toBeInTheDocument();
    expect(screen.queryByText("Written by")).not.toBeInTheDocument();
    expect(screen.queryByText("Music")).not.toBeInTheDocument();
  });

  it("pads ranks to two digits", () => {
    render(<OutlinedRank value={1} />);
    expect(screen.getByText("01")).toBeInTheDocument();
  });

  it("draws one cell per episode and says how many are watched", () => {
    render(<ReelCells total={20} watched={17} tone="series" />);

    const cells = screen.getByRole("img", { name: "17 of 20 episodes watched" });
    expect(cells.children).toHaveLength(20);
  });
});
