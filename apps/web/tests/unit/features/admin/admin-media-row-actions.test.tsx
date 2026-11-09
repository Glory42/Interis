import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../support/msw/server";
import { AdminMediaRowActions } from "@/features/admin/components/AdminMediaRowActions";
import type { AdminMediaKind, AdminMediaTitle } from "@/features/admin/media-api";

const media: AdminMediaTitle = { id: 7, tmdbId: 550, title: "Night Train", year: 1999, credit: "A. Person" };

const renderRow = (kind: AdminMediaKind) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AdminMediaRowActions kind={kind} media={media} />
    </QueryClientProvider>,
  );
};

const capture = (method: "patch" | "post" | "delete", path: string) => {
  const captured: { called: boolean; body: unknown } = { called: false, body: undefined };
  server.use(
    http[method](`http://localhost${path}`, async ({ request }) => {
      captured.called = true;
      captured.body = method === "patch" ? await request.json() : undefined;
      return HttpResponse.json({ success: true });
    }),
  );
  return captured;
};

describe.each([
  { kind: "movie" as const, path: "/api/admin/movies/7", noun: "movie", creditLabel: "Director", creditField: "director" },
  { kind: "serial" as const, path: "/api/admin/serials/7", noun: "series", creditLabel: "Creator", creditField: "creator" },
])("admin $noun row actions", ({ kind, path, noun, creditLabel, creditField }) => {
  it(`edits the title and ${creditField}`, async () => {
    const user = userEvent.setup();
    const captured = capture("patch", path);
    renderRow(kind);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    const dialog = within(screen.getByRole("dialog", { name: `Edit ${noun}` }));
    const credit = dialog.getByPlaceholderText(creditLabel);
    expect(credit).toHaveValue("A. Person");
    await user.clear(credit);
    await user.type(credit, "B. Person");
    await user.click(dialog.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(captured.body).toEqual({ title: "Night Train", [creditField]: "B. Person" }));
  });

  it("refreshes from TMDB", async () => {
    const user = userEvent.setup();
    const captured = capture("post", `${path}/refresh`);
    renderRow(kind);

    await user.click(screen.getByRole("button", { name: "Refresh from TMDB" }));
    const dialog = within(screen.getByRole("dialog", { name: "Refresh from TMDB" }));
    await user.click(dialog.getByRole("button", { name: "Refresh" }));

    await waitFor(() => expect(captured.called).toBe(true));
  });

  it("deletes only once the title is typed", async () => {
    const user = userEvent.setup();
    const captured = capture("delete", path);
    renderRow(kind);

    await user.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = within(screen.getByRole("dialog", { name: `Delete ${noun}` }));
    const confirm = dialog.getByRole("button", { name: "Delete" });
    expect(confirm).toBeDisabled();
    await user.type(dialog.getByPlaceholderText("Night Train"), "Night Train");
    await user.click(confirm);

    await waitFor(() => expect(captured.called).toBe(true));
  });
});
