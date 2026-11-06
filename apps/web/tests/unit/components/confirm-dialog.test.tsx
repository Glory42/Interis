import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

describe("ConfirmDialog", () => {
  it("shows the slate context, title and both actions in one layout", async () => {
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        isOpen
        context="Account · Delete"
        title="Delete glory42?"
        description="This can't be undone."
        confirmLabel="Delete account"
        cancelLabel="Keep account"
        isDestructive
        onConfirm={() => {}}
        onClose={onClose}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "Delete glory42?" });
    expect(dialog).toHaveTextContent("Account · Delete");
    expect(screen.getByRole("button", { name: "Delete account" })).toBeEnabled();
    await userEvent.click(screen.getByRole("button", { name: "Close Delete glory42? dialog" }));
    await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("asks for the current password and passes it to onConfirm", async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        isOpen
        title="Delete glory42?"
        confirmLabel="Delete account"
        isDestructive
        requirePassword
        onConfirm={onConfirm}
        onClose={() => {}}
      />,
    );

    const confirm = screen.getByRole("button", { name: "Delete account" });
    expect(confirm).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Current password"), "hunter22");
    await userEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledWith("hunter22");
  });
});
