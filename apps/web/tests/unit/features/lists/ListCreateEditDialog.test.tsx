import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../support/msw/server";
import { ListCreateEditDialog } from "@/features/lists/components/ListCreateEditDialog";
import type { ListSummary } from "@/features/lists/api";

const renderDialog = (
  props:
    | { mode: "create" }
    | { mode: "edit"; list: ListSummary },
  onClose: () => void = () => {},
) => {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const dialogProps =
    props.mode === "create"
      ? { mode: "create" as const, ownerUsername: "owner" }
      : { mode: "edit" as const, ownerUsername: "owner", list: props.list };

  return render(
    <QueryClientProvider client={queryClient}>
      <ListCreateEditDialog isOpen onClose={onClose} {...dialogProps} />
    </QueryClientProvider>,
  );
};

const existingList: ListSummary = {
  id: "list-1",
  userId: "owner-id",
  title: "Existing List",
  description: "An existing description",
  isRanked: true,
  isPublic: false,
  derivedType: null,
  itemCount: 3,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  coverImages: [],
};

describe("ListCreateEditDialog (create mode)", () => {
  it("disables submit until a non-blank title is entered", async () => {
    const user = userEvent.setup();
    renderDialog({ mode: "create" });

    expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();

    await user.type(screen.getByPlaceholderText("Give your list a name..."), "   ");
    expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();

    await user.type(screen.getByPlaceholderText("Give your list a name..."), "My List");
    expect(screen.getByRole("button", { name: "Create" })).toBeEnabled();
  });

  it("truncates the title to 100 characters and description to 500, live-updating the description counter", () => {
    renderDialog({ mode: "create" });

    const titleInput = screen.getByPlaceholderText("Give your list a name...");
    fireEvent.change(titleInput, { target: { value: "a".repeat(150) } });
    expect((titleInput as HTMLInputElement).value).toHaveLength(100);

    const descriptionInput = screen.getByPlaceholderText("What's this list about?");
    fireEvent.change(descriptionInput, { target: { value: "b".repeat(600) } });
    expect((descriptionInput as HTMLTextAreaElement).value).toHaveLength(500);
    expect(screen.getByText("500/500")).toBeInTheDocument();
  });

  it("defaults to public and unranked", () => {
    renderDialog({ mode: "create" });
    expect(screen.getByRole("button", { name: "Public" })).toHaveStyle({
      color: "var(--primary)",
    });
    expect(screen.getByRole("button", { name: "Unranked" })).toHaveStyle({
      color: "var(--primary)",
    });
  });

  it("submits the trimmed title, omits an empty description, and closes on success", async () => {
    let receivedBody: unknown = null;
    server.use(
      http.post("*/api/lists", async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({
          id: "new-list",
          userId: "owner-id",
          title: "My List",
          description: null,
          isRanked: false,
          isPublic: true,
          derivedType: null,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        });
      }),
    );

    const user = userEvent.setup();
    let closed = false;
    renderDialog({ mode: "create" }, () => {
      closed = true;
    });

    await user.type(screen.getByPlaceholderText("Give your list a name..."), "  My List  ");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(closed).toBe(true));

    expect(receivedBody).toEqual({
      title: "My List",
      description: undefined,
      isPublic: true,
      isRanked: false,
    });
  });

  it("does not close and does not throw an unhandled rejection when the request fails", async () => {
    server.use(
      http.post("*/api/lists", () => HttpResponse.json({ error: "nope" }, { status: 400 })),
    );

    const user = userEvent.setup();
    let closed = false;
    renderDialog({ mode: "create" }, () => {
      closed = true;
    });

    await user.type(screen.getByPlaceholderText("Give your list a name..."), "My List");
    await user.click(screen.getByRole("button", { name: "Create" }));

    // Let the rejected mutateAsync settle.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(closed).toBe(false);
  });
});

describe("ListCreateEditDialog (edit mode)", () => {
  it("pre-fills the form from the existing list", () => {
    renderDialog({ mode: "edit", list: existingList });

    expect(screen.getByPlaceholderText("Give your list a name...")).toHaveValue(
      "Existing List",
    );
    expect(screen.getByPlaceholderText("What's this list about?")).toHaveValue(
      "An existing description",
    );
    expect(screen.getByRole("button", { name: "Private" })).toHaveStyle({
      color: "var(--primary)",
    });
    expect(screen.getByRole("button", { name: "Ranked" })).toHaveStyle({
      color: "var(--primary)",
    });
  });

  it("sends description: null (not undefined) when cleared, unlike create mode", async () => {
    let receivedBody: unknown = null;
    server.use(
      http.patch("*/api/lists/list-1", async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({
          ...existingList,
          description: null,
        });
      }),
    );

    const user = userEvent.setup();
    renderDialog({ mode: "edit", list: existingList });

    const descriptionInput = screen.getByPlaceholderText("What's this list about?");
    await user.clear(descriptionInput);
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(receivedBody).not.toBeNull());
    expect((receivedBody as { description: unknown }).description).toBeNull();
  });
});
