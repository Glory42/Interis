import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Heart } from "lucide-react";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { MediaActionButton } from "@/features/media/components/MediaActionButton";

const baseProps = {
  icon: Heart,
  label: "Like",
  accentColor: "#ff0000",
  mutedColor: "#888888",
  borderColor: "#333333",
};

describe("MediaActionButton", () => {
  it("renders a login link instead of a button when the viewer is not authenticated", async () => {
    const onClick = vi.fn();
    await renderWithProviders(
      <MediaActionButton {...baseProps} isAuthenticated={false} onClick={onClick} />,
    );

    const link = screen.getByRole("link", { name: "Like" });
    expect(link).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("calls onClick when an authenticated user clicks the button", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    await renderWithProviders(
      <MediaActionButton {...baseProps} isAuthenticated onClick={onClick} />,
    );

    await user.click(screen.getByRole("button", { name: "Like" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("shows the active label instead of the base label when isActive is true", async () => {
    await renderWithProviders(
      <MediaActionButton
        {...baseProps}
        isAuthenticated
        isActive
        activeLabel="Liked"
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Liked" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Like" })).not.toBeInTheDocument();
  });

  it("falls back to the base label when isActive is true but no activeLabel is given", async () => {
    await renderWithProviders(
      <MediaActionButton {...baseProps} isAuthenticated isActive onClick={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: "Like" })).toBeInTheDocument();
  });

  it("does not call onClick when disabled", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    await renderWithProviders(
      <MediaActionButton {...baseProps} isAuthenticated disabled onClick={onClick} />,
    );

    await user.click(screen.getByRole("button", { name: "Like" }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
