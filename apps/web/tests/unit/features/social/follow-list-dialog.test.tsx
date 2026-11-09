import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient } from "@tanstack/react-query";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { FollowListDialog } from "@/features/social/components/FollowListDialog";

const person = (id: string, username: string) => ({ id, username, displayUsername: null, avatarUrl: null });

const renderDialog = (props: { mode: "followers" | "following"; profileUsername: string; isOwnProfile: boolean }, signedIn = true) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  queryClient.setQueryData(authKeys.me, signedIn ? { id: "u_me", username: "cinefan" } : null);
  renderWithProviders(<FollowListDialog isOpen onClose={vi.fn()} {...props} />, { queryClient });
};

const rowOf = (username: string) => screen.getByText(`@${username}`).closest("li")!;

describe("follow toggles in the followers/following dialog", () => {
  it("lets you follow and unfollow people on someone else's list, but not yourself", async () => {
    const user = userEvent.setup();
    const onFollow = vi.fn();
    const onUnfollow = vi.fn();
    server.use(
      http.get("*/api/social/followers/walt", () =>
        HttpResponse.json([person("u_jesse", "jesse"), person("u_me", "cinefan"), person("u_skyler", "skyler")]),
      ),
      http.get("*/api/social/following-status", () => HttpResponse.json({ followingIds: ["u_skyler"] })),
      http.post("*/api/social/follow/:username", ({ params }) => {
        onFollow(params.username);
        return HttpResponse.json({ success: true });
      }),
      http.delete("*/api/social/follow/:username", ({ params }) => {
        onUnfollow(params.username);
        return HttpResponse.json({ success: true });
      }),
    );
    renderDialog({ mode: "followers", profileUsername: "walt", isOwnProfile: false });

    const followJesse = await within(await waitFor(() => rowOf("jesse"))).findByRole("button", { name: "Follow @jesse" });
    expect(within(rowOf("cinefan")).queryByRole("button")).not.toBeInTheDocument();
    expect(within(rowOf("skyler")).getByRole("button", { name: "Unfollow @skyler" })).toHaveTextContent("Following");
    expect(screen.queryByRole("button", { name: /Remove/ })).not.toBeInTheDocument();

    await user.click(followJesse);
    expect(await within(rowOf("jesse")).findByRole("button", { name: "Unfollow @jesse" })).toBeInTheDocument();
    await waitFor(() => expect(onFollow).toHaveBeenCalledWith("jesse"));

    await user.click(within(rowOf("skyler")).getByRole("button", { name: "Unfollow @skyler" }));
    expect(await within(rowOf("skyler")).findByRole("button", { name: "Follow @skyler" })).toBeInTheDocument();
    await waitFor(() => expect(onUnfollow).toHaveBeenCalledWith("skyler"));
  });

  it("offers Follow back and Remove on your own followers list", async () => {
    server.use(
      http.get("*/api/social/followers/cinefan", () => HttpResponse.json([person("u_jesse", "jesse")])),
      http.get("*/api/social/following-status", () => HttpResponse.json({ followingIds: [] })),
    );
    renderDialog({ mode: "followers", profileUsername: "cinefan", isOwnProfile: true });

    expect(await screen.findByRole("button", { name: "Follow back @jesse" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove @jesse from your followers" })).toBeInTheDocument();
  });

  it("shows no toggles to signed-out visitors", async () => {
    const onStatus = vi.fn();
    server.use(
      http.get("*/api/social/following/walt", () => HttpResponse.json([person("u_jesse", "jesse")])),
      http.get("*/api/social/following-status", () => {
        onStatus();
        return HttpResponse.json({ followingIds: [] });
      }),
    );
    renderDialog({ mode: "following", profileUsername: "walt", isOwnProfile: false }, false);

    expect(await screen.findByText("@jesse")).toBeInTheDocument();
    expect(within(rowOf("jesse")).queryByRole("button")).not.toBeInTheDocument();
    expect(onStatus).not.toHaveBeenCalled();
  });
});
