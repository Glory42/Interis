import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { DuotoneBackdrop } from "@/components/film/DuotoneBackdrop";

describe("DuotoneBackdrop", () => {
  it("tints its media with the film or TV colour, hidden from assistive tech", () => {
    const { container } = render(
      <DuotoneBackdrop tone="series">
        <img src="/backdrop.jpg" alt="" />
      </DuotoneBackdrop>,
    );

    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root.style.getPropertyValue("--duotone-tint")).toBe("var(--series)");
    expect(root.querySelector("img")).toHaveAttribute("src", "/backdrop.jpg");
  });

  it("uses the action colour when the backdrop isn't about one medium", () => {
    const { container } = render(<DuotoneBackdrop tone="neutral" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.getPropertyValue("--duotone-tint")).toBe("var(--primary)");
  });
});
