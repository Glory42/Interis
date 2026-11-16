import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient } from "@tanstack/react-query";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { ListFormPage } from "@/features/lists/pages/ListFormPage";
import { ProfileListDetailPage } from "@/features/profile/pages/ProfileListDetailPage";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { listDetailJson, viewer } from "./list-fixtures";

const withViewer = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  queryClient.setQueryData(authKeys.me, viewer);
  return queryClient;
};

const serveList = (overrides: Record<string, unknown>) =>
  server.use(http.get("*/api/lists/list-1", () => HttpResponse.json(listDetailJson(overrides))));

const renderEditPage = () =>
  renderWithProviders(<ListFormPage mode="edit" username="viewer" listId="list-1" />, { queryClient: withViewer() });

const renderDetailPage = () =>
  renderWithProviders(<ProfileListDetailPage username="viewer" listId="list-1" />, { queryClient: withViewer() });

describe("list edit UI by List Collaborator role", () => {
  it("gives the owner the list settings and entry tools", async () => {
    serveList({ userId: viewer.id, ownerUsername: "viewer", viewerRole: "owner" });
    renderEditPage();

    expect(await screen.findByText("Edit List")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Give your list a name...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByLabelText("Note for Rififi")).toHaveValue("Start here");
  });

  it("gives a collaborator only the entry tools", async () => {
    serveList({ viewerRole: "collaborator" });
    renderEditPage();

    expect(await screen.findByText("Edit Entries")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Give your list a name...")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Done" })).toBeInTheDocument();
    expect(screen.getByLabelText("Note for Rififi")).toBeInTheDocument();
  });

  it("saves an edited note on blur", async () => {
    let saved: unknown = null;
    serveList({ viewerRole: "collaborator" });
    server.use(
      http.patch("*/api/lists/list-1/items/entry-1", async ({ request }) => {
        saved = await request.json();
        return HttpResponse.json({ id: "entry-1", note: "Then this" });
      }),
    );
    const user = userEvent.setup();
    renderEditPage();

    const note = await screen.findByLabelText("Note for Rififi");
    await user.clear(note);
    await user.type(note, "Then this");
    await user.tab();
    await waitFor(() => expect(saved).toEqual({ note: "Then this" }));
  });

  it("refuses the edit page to anyone else", async () => {
    serveList({ viewerRole: "none", isPublic: true });
    renderEditPage();
    expect(await screen.findByText("You can't edit this list.")).toBeInTheDocument();
  });
});

describe("list page actions by List Collaborator role", () => {
  const openMenu = async () => {
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "List actions" }));
    return screen.getAllByRole("menuitem").map((item) => item.textContent);
  };

  it("lets the owner edit, manage collaborators and delete", async () => {
    serveList({ userId: viewer.id, ownerUsername: "viewer", viewerRole: "owner" });
    renderDetailPage();
    expect(await openMenu()).toEqual(["Edit", "Manage collaborators", "Delete"]);
    expect(screen.getByRole("button", { name: "Manage collaborators" })).toBeInTheDocument();
  });

  it("lets a collaborator edit entries or leave, and credits who added what", async () => {
    serveList({
      viewerRole: "collaborator",
      collaborators: [{ userId: viewer.id, username: "viewer", displayUsername: null, avatarUrl: null, status: "accepted" }],
    });
    renderDetailPage();
    expect(await openMenu()).toEqual(["Edit entries", "Leave list"]);
    expect(screen.getByText("Added by viewer")).toBeInTheDocument();
    expect(screen.getByText(/By owner/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Manage collaborators/ })).not.toBeInTheDocument();
  });

  it("offers a pending invitee accept and decline", async () => {
    let accepted = false;
    serveList({ viewerRole: "invitee" });
    server.use(
      http.post("*/api/lists/list-1/collaborators/accept", () => {
        accepted = true;
        return HttpResponse.json({ success: true });
      }),
    );
    const user = userEvent.setup();
    renderDetailPage();

    expect(await screen.findByText("owner invited you to edit this list with them.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Decline" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Accept" }));
    await waitFor(() => expect(accepted).toBe(true));
  });
});
