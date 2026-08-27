import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { AlbumEditionsSection } from "@/features/music/components/music-detail/AlbumEditionsSection";

describe("AlbumEditionsSection", () => {
  it("stays collapsed and doesn't fetch until the user opens it", async () => {
    await renderWithProviders(<AlbumEditionsSection mbid="album-mbid" />);

    expect(screen.getByRole("button", { name: /show editions/i })).toBeInTheDocument();
    expect(screen.queryByText("OK Computer (Collector's Edition)")).not.toBeInTheDocument();
  });

  it("lists the album's editions, in the order the API returns them, once opened", async () => {
    const user = userEvent.setup();
    await renderWithProviders(<AlbumEditionsSection mbid="album-mbid" />);

    await user.click(screen.getByRole("button", { name: /show editions/i }));

    await waitFor(() => {
      expect(screen.getByText("OK Computer (Collector's Edition)")).toBeInTheDocument();
    });

    const titles = screen.getAllByRole("button", { name: /OK Computer/ }).map((el) => el.textContent);
    expect(titles[0]).toContain("1997");
    expect(titles[1]).toContain("2009");
  });

  it("shows the tracklist for an edition once it's selected", async () => {
    const user = userEvent.setup();
    await renderWithProviders(<AlbumEditionsSection mbid="album-mbid" />);

    await user.click(screen.getByRole("button", { name: /show editions/i }));
    await waitFor(() => {
      expect(screen.getByText("OK Computer (Collector's Edition)")).toBeInTheDocument();
    });

    await user.click(screen.getAllByRole("button", { name: /OK Computer/ })[0]!);

    await waitFor(() => {
      expect(screen.getByText("Airbag")).toBeInTheDocument();
    });
    expect(screen.getByText("Paranoid Android")).toBeInTheDocument();
  });
});
