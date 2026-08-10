import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../support/msw/server";
import { FeedReviewEditDialog } from "@/features/feed/components/FeedReviewEditDialog";

const renderDialog = (onClose: () => void = () => {}) => {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <FeedReviewEditDialog
        isOpen
        onClose={onClose}
        reviewId="review-1"
        initialContent="original content"
        containsSpoilers={false}
      />
    </QueryClientProvider>,
  );
};

describe("FeedReviewEditDialog", () => {
  it("saves and closes on success", async () => {
    server.use(
      http.put("*/api/reviews/review-1", async () =>
        HttpResponse.json({
          id: "review-1",
          content: "updated content",
          containsSpoilers: false,
          updatedAt: "2026-01-01T00:00:00.000Z",
        }),
      ),
    );

    const user = userEvent.setup();
    let closed = false;
    renderDialog(() => {
      closed = true;
    });

    const textarea = screen.getByRole("textbox");
    await user.clear(textarea);
    await user.type(textarea, "updated content");
    await user.click(screen.getByRole("button", { name: "save" }));

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(closed).toBe(true);
  });

  it("does not close and does not throw an unhandled rejection when the save fails", async () => {
    server.use(
      http.put("*/api/reviews/review-1", () =>
        HttpResponse.json({ error: "nope" }, { status: 400 }),
      ),
    );

    const user = userEvent.setup();
    let closed = false;
    renderDialog(() => {
      closed = true;
    });

    const textarea = screen.getByRole("textbox");
    await user.clear(textarea);
    await user.type(textarea, "updated content");
    await user.click(screen.getByRole("button", { name: "save" }));

    // Let the rejected mutateAsync settle - runDialogSubmit must swallow
    // it, and the dialog must stay open.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(closed).toBe(false);
    expect(screen.getByText("nope")).toBeInTheDocument();
  });
});
