import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { LoginForm } from "@/features/auth/components/LoginForm";

const serveTrending = () =>
  server.use(
    http.get("*/api/movies/trending", () =>
      HttpResponse.json([{ tmdbId: 550, title: "Fight Club", posterPath: "/fc.jpg", releaseYear: 1999 }]),
    ),
    http.get("*/api/serials/trending", () =>
      HttpResponse.json([{ tmdbId: 1396, title: "Breaking Bad", posterPath: "/bb.jpg", firstAirYear: 2008 }]),
    ),
  );

describe("AuthShell", () => {
  it("frames sign in as reel 01 with the steps, and a strip of what's trending", async () => {
    serveTrending();
    renderWithProviders(<AuthShell>form</AuthShell>, { routePath: "/login" });

    expect(await screen.findByText("Interis · Reel 01 · Sign in")).toBeInTheDocument();
    const steps = screen.getByRole("navigation", { name: "Account steps" });
    expect(within(steps).getByRole("link", { name: "01 Sign in" })).toHaveAttribute("aria-current", "page");
    expect(within(steps).getByRole("link", { name: "02 Join" })).toHaveAttribute("href", "/register");
    expect(within(steps).getByRole("link", { name: "03 Recover" })).toHaveAttribute("href", "/forgot-password");
    expect(await screen.findByRole("link", { name: "Fight Club" })).toHaveAttribute("href", "/movies/550");
    expect(screen.getByRole("link", { name: "Breaking Bad" })).toHaveAttribute("href", "/serials/1396");
  });
});

describe("LoginForm", () => {
  it("sets the fields up for password managers and phones", async () => {
    renderWithProviders(<LoginForm />, { routePath: "/login" });

    const email = await screen.findByLabelText("Email");
    expect(email).toHaveAttribute("type", "email");
    expect(email).toHaveAttribute("autocomplete", "username");
    expect(email).toHaveAttribute("inputmode", "email");
    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("autocomplete", "current-password");
    expect(password).not.toHaveAttribute("minlength");
    expect(screen.getByRole("link", { name: "Forgot it?" })).toHaveAttribute("href", "/forgot-password");
  });

  it("says plainly when the email and password don't match, with a way to recover", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("*/api/auth/sign-in/email", () => HttpResponse.json({ error: "Invalid email or password" }, { status: 401 })),
    );
    renderWithProviders(<LoginForm />, { routePath: "/login" });

    await user.type(await screen.findByLabelText("Email"), "me@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("That email and password don't match.");
    expect(within(alert).getByRole("link", { name: "Recover your password" })).toHaveAttribute("href", "/forgot-password");
  });
});
