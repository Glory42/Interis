import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { AdminCachePage } from "@/features/admin/components/AdminCachePage";

const summary = {
  startedAt: "2026-11-07T06:00:00.000Z",
  memory: { hits: 1204, misses: 310 },
  titles: { movies: 10412, serials: 2207 },
  unreferenced: { movies: 2940, serials: 41 },
};

const serve = () => {
  const posts: { path: string; body: unknown }[] = [];
  server.use(
    http.get("*/api/admin/cache", () => HttpResponse.json(summary)),
    http.post("*/api/admin/cache/refresh-oldest", async ({ request }) => {
      posts.push({ path: "refresh-oldest", body: await request.json() });
      return HttpResponse.json({ titles: [{ id: 1, title: "Old Film", ok: true }, { id: 2, title: "Gone Film", ok: false }] });
    }),
    http.post("*/api/admin/cache/purge", async ({ request }) => {
      posts.push({ path: "purge", body: await request.json() });
      return HttpResponse.json({ movies: 2940, serials: 41 });
    }),
  );
  return posts;
};

describe("AdminCachePage", () => {
  it("summarises the TMDB mirror", async () => {
    serve();
    const { container } = renderWithProviders(<AdminCachePage />);

    expect(await screen.findByText("10,412")).toBeInTheDocument();
    expect(container).toHaveTextContent("Series cached2,207");
    expect(container).toHaveTextContent("Unreferenced2,940 films · 41 series");
    expect(container).toHaveTextContent("1,204 hits · 310 misses");
  });

  it("refreshes the 25 oldest films and says which came back", async () => {
    const user = userEvent.setup();
    const posts = serve();
    renderWithProviders(<AdminCachePage />);

    await user.click(await screen.findByRole("button", { name: "Refresh oldest 25 films" }));
    expect(await screen.findByText("1 of 2 refreshed · failed: Gone Film")).toBeInTheDocument();
    expect(posts[0]).toEqual({ path: "refresh-oldest", body: { kind: "movie" } });
  });

  it("purges unreferenced titles only after the admin's password", async () => {
    const user = userEvent.setup();
    const posts = serve();
    renderWithProviders(<AdminCachePage />);

    await user.click(await screen.findByRole("button", { name: "Purge 2,981…" }));
    expect(screen.getByRole("button", { name: "Purge" })).toBeDisabled();
    await user.type(screen.getByLabelText("Current password"), "admin-pass-1");
    await user.click(screen.getByRole("button", { name: "Purge" }));

    expect(await screen.findByText("Purged 2,940 films and 41 series.")).toBeInTheDocument();
    await vi.waitFor(() => expect(posts[0]).toEqual({ path: "purge", body: { adminPassword: "admin-pass-1" } }));
  });
});
