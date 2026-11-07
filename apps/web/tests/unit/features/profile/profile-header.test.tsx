import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { ProfileHeaderCompact } from "@/features/profile/components/ProfileHeaderCompact";
import { ProfileActions } from "@/features/profile/components/ProfileActions";
import type { PublicProfile } from "@/types/api";

const profile = (overrides: Partial<PublicProfile> = {}): PublicProfile => ({
  id: "u1",
  username: "glory42",
  displayUsername: "glory42",
  bio: "Selamlar :))",
  location: "Andromeda",
  avatarUrl: null,
  favoriteGenres: ["Science Fiction", "Thriller"],
  isAdmin: false,
  createdAt: "2026-03-14T10:00:00.000Z",
  ...overrides,
});

const stats = { logged: 1563, reviews: 85, following: 6, followers: 3 };

describe("ProfileHeaderCompact", () => {
  it("puts the counts under the name as one line", async () => {
    const { container } = renderWithProviders(<ProfileHeaderCompact profile={profile()} stats={stats} />);
    await screen.findByRole("heading", { name: "glory42" });
    expect(container).toHaveTextContent("1,563 logged · 85 reviews · 6 following · 3 followers");
    expect(screen.getByText("Profile · glory42")).toBeInTheDocument();
    expect(screen.getByText("Joined Mar 2026")).toBeInTheDocument();
  });

  it("opens the follow lists from the counts", async () => {
    const user = userEvent.setup();
    const onFollowersClick = vi.fn();
    renderWithProviders(<ProfileHeaderCompact profile={profile()} stats={stats} onFollowersClick={onFollowersClick} />);
    await user.click(await screen.findByRole("button", { name: /3 followers/ }));
    expect(onFollowersClick).toHaveBeenCalled();
  });

  it("leaves out what the person hasn't filled in", async () => {
    const { container } = renderWithProviders(
      <ProfileHeaderCompact profile={profile({ bio: null, location: "", favoriteGenres: [] })} stats={stats} />,
    );
    await screen.findByRole("heading", { name: "glory42" });
    expect(container).not.toHaveTextContent("No bio yet.");
    expect(container).not.toHaveTextContent("Unknown Galaxy");
    expect(container).not.toHaveTextContent("enjoys");
  });
});

const handlers = () => ({ onToggleFollow: vi.fn(), onToggleMute: vi.fn(), onToggleBlock: vi.fn() });
const state = { isFollowing: false, isMuted: false, isBlocked: false, isBusy: false };

describe("ProfileActions", () => {
  it("offers Edit profile on your own page", async () => {
    renderWithProviders(<ProfileActions mode="owner" username="glory42" {...state} {...handlers()} />);
    expect(await screen.findByRole("link", { name: "Edit profile" })).toHaveAttribute("href", "/settings/profile");
  });

  it("makes Follow the main action and tucks Mute and Block into ⋯", async () => {
    const user = userEvent.setup();
    const actions = handlers();
    renderWithProviders(<ProfileActions mode="viewer" username="mira" {...state} {...actions} />);

    const follow = await screen.findByRole("button", { name: "Follow user" });
    expect(follow).toHaveTextContent("Follow");
    expect(screen.queryByRole("menuitem", { name: "Mute user" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "More actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Mute user" }));
    expect(actions.onToggleMute).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "More actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Block user" }));
    expect(actions.onToggleBlock).toHaveBeenCalled();
  });

  it("names the reverse actions once they're on", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ProfileActions mode="viewer" username="mira" {...state} isFollowing isMuted isBlocked {...handlers()} />,
    );
    expect(await screen.findByRole("button", { name: "Follow user" })).toHaveTextContent("Following");
    await user.click(screen.getByRole("button", { name: "More actions" }));
    expect(screen.getByRole("menuitem", { name: "Unmute user" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Unblock user" })).toBeInTheDocument();
  });

  it("sends guests to sign in to follow", async () => {
    renderWithProviders(<ProfileActions mode="guest" username="mira" {...state} {...handlers()} />);
    expect(await screen.findByRole("link", { name: "Follow" })).toHaveAttribute("href", "/login?redirect=%2Fprofile%2Fmira");
  });
});
