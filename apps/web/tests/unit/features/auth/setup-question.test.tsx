import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { SetupSecurityQuestionForm } from "@/features/auth/components/SetupSecurityQuestionForm";

describe("SetupSecurityQuestionForm", () => {
  it("explains why it's needed and offers prompts that only fill the field", async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<SetupSecurityQuestionForm />, { routePath: "/setup-security-question" });

    expect(await screen.findByRole("heading", { name: "Set a question only you can answer." })).toBeInTheDocument();
    expect(container).toHaveTextContent("Interis doesn't send reset emails.");
    expect(container).not.toHaveTextContent(/only way to change/i);

    await user.click(screen.getByRole("button", { name: "Most rewatched film?" }));
    expect(screen.getByLabelText("Your question")).toHaveValue("Which film have you rewatched the most?");

    const answer = screen.getByLabelText("Your answer");
    expect(answer).toHaveAttribute("autocomplete", "off");
    await user.type(answer, "Heat");
    expect(screen.getByText("4 / 200")).toBeInTheDocument();
  });

  it("saves and opens the diary", async () => {
    const user = userEvent.setup();
    let body: unknown = null;
    server.use(
      http.post("*/api/auth/security-question", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true });
      }),
    );
    const { router } = renderWithProviders(<SetupSecurityQuestionForm />, { routePath: "/setup-security-question" });

    await user.click(await screen.findByRole("button", { name: "First film in a cinema?" }));
    await user.type(screen.getByLabelText("Your answer"), "Odeon");
    await user.click(screen.getByRole("button", { name: "Save and open my diary" }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
    expect(body).toEqual({ question: "What was the first film you watched in a cinema?", answer: "Odeon" });
  });
});
