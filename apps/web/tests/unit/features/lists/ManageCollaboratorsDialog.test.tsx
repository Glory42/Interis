import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { ManageCollaboratorsDialog } from "@/features/lists/components/ManageCollaboratorsDialog";
import type { ListCollaborator } from "@/features/lists/api";

const person = (id: string, status: ListCollaborator["status"]): ListCollaborator => ({
  userId: `user-${id}`,
  username: id,
  displayUsername: null,
  avatarUrl: null,
  status,
});

const renderDialog = (collaborators: ListCollaborator[]) =>
  renderWithProviders(
    <ManageCollaboratorsDialog isOpen onClose={vi.fn()} listId="list-1" ownerId="user-owner" collaborators={collaborators} />,
  );

describe("ManageCollaboratorsDialog", () => {
  it("lists collaborators, marking pending invites", async () => {
    renderDialog([person("ana", "accepted"), person("ben", "invited")]);

    const list = await screen.findByRole("list", { name: "Collaborators" });
    expect(within(list).getByText("ana")).toBeInTheDocument();
    const ben = within(list).getByText("ben").closest("li")!;
    expect(within(ben).getByText("Invited")).toBeInTheDocument();
    expect(screen.getByText("Invite by username · 2/10")).toBeInTheDocument();
  });

  it("searches people, hides the owner and existing collaborators, and invites by username", async () => {
    let invited: unknown = null;
    server.use(
      http.get("*/api/users", () =>
        HttpResponse.json([
          { id: "user-owner", username: "owner", displayUsername: null, avatarUrl: null },
          { id: "user-ana", username: "ana", displayUsername: null, avatarUrl: null },
          { id: "user-cleo", username: "cleo", displayUsername: null, avatarUrl: null },
        ]),
      ),
      http.post("*/api/lists/list-1/collaborators", async ({ request }) => {
        invited = await request.json();
        return HttpResponse.json({ userId: "user-cleo", username: "cleo", status: "invited" }, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderDialog([person("ana", "accepted")]);

    await user.type(await screen.findByLabelText(/Invite by username/), "c");
    const found = await screen.findByRole("list", { name: "People found" });
    await waitFor(() => expect(within(found).getByRole("button", { name: "Invite cleo" })).toBeInTheDocument());
    expect(within(found).queryByRole("button", { name: "Invite owner" })).not.toBeInTheDocument();
    expect(within(found).queryByRole("button", { name: "Invite ana" })).not.toBeInTheDocument();

    await user.click(within(found).getByRole("button", { name: "Invite cleo" }));
    await waitFor(() => expect(invited).toEqual({ username: "cleo" }));
  });

  it("removes a collaborator", async () => {
    let removedPath: string | null = null;
    server.use(
      http.delete("*/api/lists/list-1/collaborators/:userId", ({ params }) => {
        removedPath = String(params.userId);
        return HttpResponse.json({ success: true });
      }),
    );
    const user = userEvent.setup();
    renderDialog([person("ana", "accepted")]);

    await user.click(await screen.findByRole("button", { name: "Remove ana" }));
    await waitFor(() => expect(removedPath).toBe("user-ana"));
  });

  it("stops inviting once the list has 10 collaborators", async () => {
    renderDialog(Array.from({ length: 10 }, (_, i) => person(`p${i}`, "accepted")));
    expect(await screen.findByLabelText(/Invite by username/)).toBeDisabled();
  });
});
