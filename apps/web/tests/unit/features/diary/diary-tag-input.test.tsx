import { useState } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DiaryTagInput } from "@/features/diary/components/DiaryTagInput";
import { normalizeDiaryTag } from "@/features/diary/diary-tags";

const Harness = ({ initial = [], suggestions = [] }: { initial?: string[]; suggestions?: string[] }) => {
  const [tags, setTags] = useState(initial);
  return (
    <>
      <DiaryTagInput value={tags} onChange={setTags} suggestions={suggestions} />
      <output aria-label="tags">{tags.join("|")}</output>
    </>
  );
};

const value = () => screen.getByLabelText("tags").textContent;

describe("DiaryTagInput", () => {
  it("adds normalized tags on Enter or comma and skips duplicates", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByRole("textbox", { name: "Add a tag" });

    await user.type(input, "  #Cinema {Enter}With   Mom,cinema{Enter}");

    expect(value()).toBe("cinema|with mom");
    expect(screen.getByText("2 / 10")).toBeInTheDocument();
  });

  it("explains an invalid tag instead of adding it", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByRole("textbox", { name: "Add a tag" }), "<b>{Enter}");

    expect(value()).toBe("");
    expect(screen.getByRole("alert")).toHaveTextContent("letters, numbers");
  });

  it("removes a tag by its button or Backspace on an empty box", async () => {
    const user = userEvent.setup();
    render(<Harness initial={["a", "b", "c"]} />);

    await user.click(screen.getByRole("button", { name: "Remove tag b" }));
    expect(value()).toBe("a|c");
    await user.type(screen.getByRole("textbox", { name: "Add a tag" }), "{Backspace}");
    expect(value()).toBe("a");
  });

  it("suggests the user's own tags that match and aren't picked yet", async () => {
    const user = userEvent.setup();
    render(<Harness initial={["cinema"]} suggestions={["cinema", "with mom", "with dad", "rewatch-night"]} />);

    expect(screen.queryByRole("button", { name: "+ cinema" })).not.toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: "Add a tag" }), "with");
    expect(screen.queryByRole("button", { name: "+ rewatch-night" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "+ with dad" }));

    expect(value()).toBe("cinema|with dad");
    expect(screen.getByRole("textbox", { name: "Add a tag" })).toHaveValue("");
  });

  it("stops taking tags at 10", () => {
    render(<Harness initial={Array.from({ length: 10 }, (_, index) => `t${index}`)} />);
    expect(screen.getByRole("textbox", { name: "Add a tag" })).toBeDisabled();
  });
});

describe("normalizeDiaryTag", () => {
  it("matches the server's rules", () => {
    expect(normalizeDiaryTag(" Rewatch-Night ")).toBe("rewatch-night");
    expect(normalizeDiaryTag("a".repeat(31))).toBeNull();
    expect(normalizeDiaryTag("a/b")).toBeNull();
  });
});
