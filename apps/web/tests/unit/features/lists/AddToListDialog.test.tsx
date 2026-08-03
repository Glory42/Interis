import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../support/msw/server";
import { AddToListDialog } from "@/features/lists/components/AddToListDialog";
import { authKeys } from "@/features/auth/hooks/useAuth";
import type { MeProfile } from "@/types/api";

const me: MeProfile = {
  id: "user-1",
  name: "Cinefan",
  email: "cinefan@example.com",
  username: "cinefan",
  bio: null,
  location: null,
  avatarUrl: null,
  favoriteGenres: [],
  isAdmin: false,
  hasSecurityQuestion: true,
};

const renderDialog = () => {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  queryClient.setQueryData(authKeys.me, me);
  return render(
    <QueryClientProvider client={queryClient}>
      <AddToListDialog tmdbId={550} itemType="cinema" />
    </QueryClientProvider>,
  );
};

describe("AddToListDialog", () => {
  it("renders nothing but a trigger closed, then opens the list on click", async () => {
    server.use(
      http.get("*/api/users/cinefan/lists", () =>
        HttpResponse.json([
          {
            id: "list-1",
            userId: "user-1",
            title: "Favorites",
            description: null,
            isRanked: false,
            isPublic: true,
            derivedType: null,
            itemCount: 0,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            coverImages: [],
            containsItem: false,
            entryId: null,
          },
        ]),
      ),
    );

    const user = userEvent.setup();
    renderDialog();

    expect(screen.queryByText("Add to list")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /lists/i }));

    await waitFor(() => expect(screen.getByText("Favorites")).toBeInTheDocument());
  });

  it("shows an empty state when the user has no lists yet", async () => {
    server.use(http.get("*/api/users/cinefan/lists", () => HttpResponse.json([])));

    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByRole("button", { name: /lists/i }));

    await waitFor(() =>
      expect(screen.getByText("No lists yet. Create one below.")).toBeInTheDocument(),
    );
  });

  it("disables the create button until a non-blank title is entered, and truncates at 100 characters", async () => {
    server.use(http.get("*/api/users/cinefan/lists", () => HttpResponse.json([])));

    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByRole("button", { name: /lists/i }));
    await waitFor(() => screen.getByText("No lists yet. Create one below."));

    await user.click(screen.getByRole("button", { name: "New list" }));
    expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();

    const titleInput = screen.getByPlaceholderText("List title...");
    await user.type(titleInput, "a".repeat(150));
    expect((titleInput as HTMLInputElement).value).toHaveLength(100);
    expect(screen.getByRole("button", { name: "Create" })).toBeEnabled();
  });

  it("creates a new list and immediately adds the current item to it", async () => {
    let addItemCalled = false;
    server.use(
      http.get("*/api/users/cinefan/lists", () => HttpResponse.json([])),
      http.post("*/api/lists", () =>
        HttpResponse.json({
          id: "new-list",
          userId: "user-1",
          title: "New List",
          description: null,
          isRanked: false,
          isPublic: true,
          derivedType: null,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        }),
      ),
      http.post("*/api/lists/new-list/items", () => {
        addItemCalled = true;
        return HttpResponse.json({ entry: { id: "entry-1" }, derivedType: "cinema" });
      }),
    );

    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByRole("button", { name: /lists/i }));
    await waitFor(() => screen.getByText("No lists yet. Create one below."));

    await user.click(screen.getByRole("button", { name: "New list" }));
    await user.type(screen.getByPlaceholderText("List title..."), "New List");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(addItemCalled).toBe(true));
  });

  it("does not throw an unhandled rejection when list creation fails", async () => {
    server.use(
      http.get("*/api/users/cinefan/lists", () => HttpResponse.json([])),
      http.post("*/api/lists", () => HttpResponse.json({ error: "nope" }, { status: 400 })),
    );

    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByRole("button", { name: /lists/i }));
    await waitFor(() => screen.getByText("No lists yet. Create one below."));

    await user.click(screen.getByRole("button", { name: "New list" }));
    await user.type(screen.getByPlaceholderText("List title..."), "New List");
    await user.click(screen.getByRole("button", { name: "Create" }));

    // The create form stays open (no visible error UI here, matching
    // ListCreateEditDialog) - this just proves nothing throws unhandled.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.getByPlaceholderText("List title...")).toBeInTheDocument();
  });

  it("toggles an existing list's containsItem state without an unhandled rejection on failure", async () => {
    server.use(
      http.get("*/api/users/cinefan/lists", () =>
        HttpResponse.json([
          {
            id: "list-1",
            userId: "user-1",
            title: "Favorites",
            description: null,
            isRanked: false,
            isPublic: true,
            derivedType: null,
            itemCount: 0,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            coverImages: [],
            containsItem: false,
            entryId: null,
          },
        ]),
      ),
      http.post("*/api/lists/list-1/items", () =>
        HttpResponse.json({ error: "nope" }, { status: 400 }),
      ),
    );

    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByRole("button", { name: /lists/i }));
    const favoritesText = await screen.findByText("Favorites");

    // Scope to the toggle button inside this specific list item, not
    // ModalHeader's own close button (which shares the same h-7 w-7
    // sizing classes and would otherwise close the whole dialog).
    const listItem = favoritesText.closest("li")!;
    const { getByRole } = within(listItem);
    await user.click(getByRole("button"));

    await new Promise((resolve) => setTimeout(resolve, 50));
    // No crash/unhandled rejection is the assertion here.
    expect(screen.getByText("Favorites")).toBeInTheDocument();
  });
});
