import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient } from "@tanstack/react-query";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { OnboardingPage, type OnboardingStep } from "@/features/onboarding/pages/OnboardingPage";

const titles = [
  { mediaType: "movie", tmdbId: 1091, title: "The Thing", posterPath: null, year: 1982 },
  { mediaType: "tv", tmdbId: 1920, title: "Twin Peaks", posterPath: null, year: 1990 },
];

const me = { id: "u_new", username: "newbie", email: "n@example.com", isAdmin: false, hasSecurityQuestion: true, onboardingCompletedAt: null };

const Harness = ({ initialStep }: { initialStep: OnboardingStep }) => {
  const [step, setStep] = useState<OnboardingStep>(initialStep);
  return <OnboardingPage step={step} onStepChange={setStep} />;
};

const setup = (initialStep: OnboardingStep = "taste") => {
  const onTaste = vi.fn();
  const onComplete = vi.fn();
  server.use(
    http.get("*/api/onboarding/titles", () => HttpResponse.json({ items: titles })),
    http.get("*/api/viewer-status", () =>
      HttpResponse.json({
        items: titles.map(({ mediaType, tmdbId }) => ({
          mediaType,
          tmdbId,
          watched: false,
          rating: null,
          liked: false,
          watchlisted: false,
          episodes: null,
        })),
      }),
    ),
    http.post("*/api/onboarding/taste", async ({ request }) => {
      onTaste(await request.json());
      return HttpResponse.json({ saved: 1, failed: [] });
    }),
    http.get("*/api/social/suggestions", () =>
      HttpResponse.json([
        { id: "u_twin", username: "twin", displayUsername: null, avatarUrl: null, sharedCount: 3, agreeTitle: "The Thing", followerCount: 2 },
      ]),
    ),
    http.get("*/api/social/following-status", () => HttpResponse.json({ followingIds: [] })),
    http.post("*/api/onboarding/complete", () => {
      onComplete();
      return HttpResponse.json({ onboardingCompletedAt: "2026-11-16T10:00:00.000Z" });
    }),
  );
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  queryClient.setQueryData(authKeys.me, me);
  const view = renderWithProviders(<Harness initialStep={initialStep} />, { queryClient });
  return { ...view, onTaste, onComplete };
};

afterEach(() => {
  window.sessionStorage.clear();
});

describe("onboarding flow", () => {
  it("saves the marked titles in one batch, then moves on to people", async () => {
    const user = userEvent.setup();
    const { onTaste } = setup();

    const thing = await screen.findByRole("button", { name: "The Thing (1982)" }, { timeout: 5000 });
    await user.click(thing);
    expect(thing).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("1 marked")).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Your rating for The Thing, out of 10" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() =>
      expect(onTaste).toHaveBeenCalledWith({
        items: [{ mediaType: "movie", tmdbId: 1091, watched: true, rating: null }],
      }),
    );
    expect(onTaste).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole("heading", { name: "People to follow" })).toBeInTheDocument();
    expect(screen.getByText("Step 2 of 2")).toBeInTheDocument();
  });

  it("taps a title twice to take it back, and sends nothing if nothing changed", async () => {
    const user = userEvent.setup();
    const { onTaste } = setup();

    const peaks = await screen.findByRole("button", { name: "Twin Peaks (1990)" });
    await user.click(peaks);
    await user.click(peaks);
    expect(peaks).toHaveAttribute("aria-pressed", "false");

    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByRole("heading", { name: "People to follow" })).toBeInTheDocument();
    expect(onTaste).not.toHaveBeenCalled();
  });

  it("skips the taste step without saving", async () => {
    const user = userEvent.setup();
    const { onTaste } = setup();

    await user.click(await screen.findByRole("button", { name: "The Thing (1982)" }));
    await user.click(screen.getByRole("button", { name: "Skip" }));

    expect(await screen.findByRole("heading", { name: "People to follow" })).toBeInTheDocument();
    expect(onTaste).not.toHaveBeenCalled();
  });

  it("keeps unsaved picks across a refresh", async () => {
    const user = userEvent.setup();
    const first = setup();
    await user.click(await screen.findByRole("button", { name: "The Thing (1982)" }));
    first.unmount();

    setup();
    expect(await screen.findByRole("button", { name: "The Thing (1982)" })).toHaveAttribute("aria-pressed", "true");
  });

  it("shows why each person is suggested, and skipping people finishes onboarding", async () => {
    const user = userEvent.setup();
    const { onComplete, queryClient } = setup("people");

    expect(await screen.findByText("Agrees on The Thing · 3 titles in common")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Follow @twin" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Skip" }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(queryClient.getQueryData<typeof me>(authKeys.me)?.onboardingCompletedAt).toBe("2026-11-16T10:00:00.000Z"),
    );
  });
});
