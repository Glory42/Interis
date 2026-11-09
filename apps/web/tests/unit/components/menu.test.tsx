import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ModalShell } from "@/components/ui/ModalShell";
import { SentenceSelect, type SentenceOption } from "@/components/ui/SentenceSelect";
import { placeMenuPanel } from "@/components/ui/menu-placement";

type Scope = "everything" | "movie" | "serials";

const options: SentenceOption<Scope>[] = [
  { value: "everything", word: "everything", label: "Everything" },
  { value: "movie", word: "films", label: "Films", hint: "⌘1" },
  { value: "serials", word: "TV", label: "TV", hint: "⌘2" },
];

const Scoped = ({ onChange = () => {} }: { onChange?: (value: Scope) => void }) => {
  const [value, setValue] = useState<Scope>("everything");
  return (
    <p>
      {"in "}
      <SentenceSelect
        value={value}
        options={options}
        onChange={(next) => {
          setValue(next);
          onChange(next);
        }}
      />
      <button type="button">after</button>
    </p>
  );
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("SentenceSelect menu", () => {
  it("renders the panel outside the trigger's subtree with hints beside the labels", async () => {
    const { container } = render(<Scoped />);
    await userEvent.click(screen.getByRole("button", { name: /everything/ }));

    const menu = screen.getByRole("menu");
    expect(container).not.toContainElement(menu);
    expect(screen.getByRole("menuitemradio", { name: "Films ⌘1" })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("menuitemradio", { name: "Everything" })).toHaveAttribute("aria-checked", "true");
  });

  it("moves with the arrow keys, Home and End, and picks with Enter", async () => {
    const onChange = vi.fn();
    render(<Scoped onChange={onChange} />);
    const trigger = screen.getByRole("button", { name: /everything/ });
    await userEvent.click(trigger);

    expect(screen.getByRole("menuitemradio", { name: "Everything" })).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitemradio", { name: /Films/ })).toHaveFocus();
    await userEvent.keyboard("{End}");
    expect(screen.getByRole("menuitemradio", { name: /TV/ })).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitemradio", { name: "Everything" })).toHaveFocus();
    await userEvent.keyboard("{ArrowUp}{Home}{ArrowDown}{Enter}");

    expect(onChange).toHaveBeenCalledWith("movie");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /films/ })).toHaveFocus();
  });

  it("opens from the keyboard and picks with Space", async () => {
    const onChange = vi.fn();
    render(<Scoped onChange={onChange} />);
    screen.getByRole("button", { name: /everything/ }).focus();

    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("menu")).toBeInTheDocument();
    await userEvent.keyboard("{ArrowUp} ");
    expect(onChange).toHaveBeenCalledWith("serials");
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    render(<Scoped />);
    const trigger = screen.getByRole("button", { name: /everything/ });
    await userEvent.click(trigger);
    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on Tab with focus back on the trigger", async () => {
    render(<Scoped />);
    const trigger = screen.getByRole("button", { name: /everything/ });
    await userEvent.click(trigger);
    await userEvent.tab();

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "after" })).toHaveFocus();
  });

  it("closes on an outside click without picking", async () => {
    const onChange = vi.fn();
    render(<Scoped onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: /everything/ }));
    await userEvent.click(screen.getByRole("button", { name: "after" }));

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("inside a modal, Escape and picks close only the menu", async () => {
    const onClose = vi.fn();
    const onChange = vi.fn();
    render(
      <ModalShell onClose={onClose}>
        <section role="dialog" aria-label="Search" className="overflow-hidden">
          <Scoped onChange={onChange} />
        </section>
      </ModalShell>,
    );

    await userEvent.click(screen.getByRole("button", { name: /everything/ }));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /everything/ }));
    await userEvent.click(screen.getByRole("menuitemradio", { name: /TV/ }));
    expect(onChange).toHaveBeenCalledWith("serials");

    await wait(300);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Search" })).toBeInTheDocument();
  });
});

describe("placeMenuPanel", () => {
  const viewport = { width: 1000, height: 800 };
  const panel = { width: 200, height: 150 };

  it("opens below, left-aligned with the trigger", () => {
    const placement = placeMenuPanel({ top: 100, bottom: 120, left: 300, right: 360 }, panel, viewport);
    expect(placement).toMatchObject({ top: 124, left: 300, side: "below" });
  });

  it("right-aligns when the panel would overflow the right edge", () => {
    const placement = placeMenuPanel({ top: 100, bottom: 120, left: 900, right: 960 }, panel, viewport);
    expect(placement.left).toBe(760);
  });

  it("opens upward when there is no room below", () => {
    const placement = placeMenuPanel({ top: 700, bottom: 720, left: 300, right: 360 }, panel, viewport);
    expect(placement).toMatchObject({ top: 546, side: "above" });
  });

  it("stays inside a narrow viewport", () => {
    const placement = placeMenuPanel({ top: 100, bottom: 120, left: 10, right: 40 }, panel, { width: 180, height: 800 });
    expect(placement.left).toBe(8);
  });
});
