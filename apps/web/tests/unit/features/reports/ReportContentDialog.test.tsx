import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../support/msw/server";
import { ReportContentDialog } from "@/features/reports/components/ReportContentDialog";

const renderDialog = () => {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ReportContentDialog
        isOpen
        onClose={() => {}}
        targetType="post"
        targetId="post-1"
      />
    </QueryClientProvider>,
  );
};

describe("ReportContentDialog", () => {
  it("defaults to 'spam' as the selected reason", () => {
    renderDialog();
    expect(screen.getByRole("radio", { name: "Spam" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Harassment" })).not.toBeChecked();
  });

  it("accepts a change up to exactly 1000 characters", () => {
    renderDialog();

    const textarea = screen.getByPlaceholderText("Additional details (optional)");
    fireEvent.change(textarea, { target: { value: "a".repeat(1000) } });

    expect((textarea as HTMLTextAreaElement).value).toHaveLength(1000);
  });

  it("rejects a single change that would exceed 1000 characters, leaving the value unchanged", () => {
    // The onChange handler is `if (value.length <= 1000) setDetails(value)`
    // - it doesn't truncate, it rejects the whole update. A one-shot paste
    // of 1001 chars therefore leaves the textarea exactly as it was
    // before (empty here), not clamped down to 1000 chars. This is
    // meaningfully different from typing up to the limit one keystroke at
    // a time, which does naturally cap at 1000 since each keystroke is
    // its own change event.
    renderDialog();

    const textarea = screen.getByPlaceholderText("Additional details (optional)");
    fireEvent.change(textarea, { target: { value: "a".repeat(1001) } });

    expect((textarea as HTMLTextAreaElement).value).toBe("");
  });

  it("submits the selected reason and trimmed details, then shows the thank-you state", async () => {
    let receivedBody: unknown = null;
    server.use(
      http.post("*/api/reports", async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({ success: true });
      }),
    );

    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("radio", { name: "Harassment" }));
    await user.type(
      screen.getByPlaceholderText("Additional details (optional)"),
      "  this user is being abusive  ",
    );
    await user.click(screen.getByRole("button", { name: "submit report" }));

    await waitFor(() =>
      expect(
        screen.getByText("Thanks — this has been reported for review."),
      ).toBeInTheDocument(),
    );

    expect(receivedBody).toEqual({
      targetType: "post",
      targetId: "post-1",
      reason: "harassment",
      details: "this user is being abusive",
    });
  });

  it("omits details entirely from the payload when left blank", async () => {
    let receivedBody: unknown = null;
    server.use(
      http.post("*/api/reports", async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({ success: true });
      }),
    );

    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "submit report" }));

    await waitFor(() =>
      expect(
        screen.getByText("Thanks — this has been reported for review."),
      ).toBeInTheDocument(),
    );

    expect(receivedBody).toMatchObject({ reason: "spam" });
    expect((receivedBody as { details?: unknown }).details).toBeUndefined();
  });

  it("shows the server's error message and stays open when the submission fails", async () => {
    server.use(
      http.post("*/api/reports", () =>
        HttpResponse.json({ error: "Target not found" }, { status: 404 }),
      ),
    );

    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "submit report" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Target not found"));
    expect(
      screen.queryByText("Thanks — this has been reported for review."),
    ).not.toBeInTheDocument();
  });

  it("disables the submit button while the request is pending", async () => {
    server.use(
      http.post("*/api/reports", async () => {
        await new Promise((resolve) => setTimeout(resolve, 30));
        return HttpResponse.json({ success: true });
      }),
    );

    const user = userEvent.setup();
    renderDialog();

    const submitButton = screen.getByRole("button", { name: "submit report" });
    await user.click(submitButton);

    expect(screen.getByRole("button", { name: /submitting/i })).toBeDisabled();
  });
});
