import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";

describe("basic controls", () => {
  it("keeps a loading button's name but makes it busy and unclickable", async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Save log
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Save log" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("marks an input with an error invalid and links the message", () => {
    render(<Input aria-label="Email" error="Add the part after @" />);

    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Add the part after @");
  });

  it("counts characters against the textarea's limit", async () => {
    render(<Textarea aria-label="Bio" maxLength={300} showCount defaultValue="Toho" />);

    expect(screen.getByText("4 / 300")).toBeInTheDocument();
    await userEvent.type(screen.getByRole("textbox", { name: "Bio" }), " films");
    expect(screen.getByText("10 / 300")).toBeInTheDocument();
  });

  it("toggles a checkbox and a switch", async () => {
    const onRewatch = vi.fn();
    const onPrivate = vi.fn();
    render(
      <>
        <Checkbox label="Rewatch" checked={false} onCheckedChange={onRewatch} />
        <Switch label="Private log" checked onCheckedChange={onPrivate} />
      </>,
    );

    await userEvent.click(screen.getByRole("checkbox", { name: "Rewatch" }));
    expect(onRewatch).toHaveBeenCalledWith(true);

    const privateSwitch = screen.getByRole("switch", { name: "Private log" });
    expect(privateSwitch).toHaveAttribute("aria-checked", "true");
    await userEvent.click(privateSwitch);
    expect(onPrivate).toHaveBeenCalledWith(false);
  });
});
