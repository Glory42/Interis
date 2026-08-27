import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { ArchiveFilterControls } from "@/features/media-archive/components/ArchiveFilterControls";

const moduleStyles = {
  accent: "#ff0000",
  text: "#ffffff",
  muted: "#888888",
  faint: "#666666",
  border: "#333333",
  borderSoft: "#222222",
  panel: "#111111",
  panelSoft: "#101010",
  panelStrong: "#202020",
  badge: "#303030",
};

const Harness = ({ withPeriod }: { withPeriod: boolean }) => {
  const controlsRef = useRef<HTMLDivElement | null>(null);

  return (
    <ArchiveFilterControls
      controlsRef={controlsRef}
      openMenu={null}
      onBlurCapture={vi.fn()}
      onToggleMenu={vi.fn()}
      onCloseMenu={vi.fn()}
      archiveCountLabel="42 items"
      selectedGenre="all"
      selectedLanguage="all"
      selectedSort="most_read"
      selectedSortLabel="Most read"
      selectedLanguageLabel="All languages"
      sortOptions={[{ value: "most_read", label: "Most read" }]}
      languageOptions={[{ value: "all", label: "All languages" }]}
      onSelectGenre={vi.fn()}
      onSelectSort={vi.fn()}
      onSelectLanguage={vi.fn()}
      moduleStyles={moduleStyles}
      {...(withPeriod
        ? {
            selectedPeriod: "all_time",
            selectedPeriodLabel: "All time",
            isPeriodDisabled: false,
            periodOptions: [{ value: "all_time", label: "All time" }],
            onSelectPeriod: vi.fn(),
          }
        : {})}
    />
  );
};

describe("ArchiveFilterControls", () => {
  it("omits the period trigger when no period props are given", async () => {
    await renderWithProviders(<Harness withPeriod={false} />);

    expect(screen.queryByText(/^Time:/)).not.toBeInTheDocument();
    expect(screen.getByText("42 items")).toBeInTheDocument();
  });

  it("shows the period trigger when period props are given", async () => {
    await renderWithProviders(<Harness withPeriod />);

    expect(screen.getByText("Time: All time")).toBeInTheDocument();
  });
});
