import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Tabs } from "@/components/ui/tabs";
import { Segmented } from "@/components/ui/segmented";
import { Chip } from "@/components/ui/chip";
import { SentenceFilter } from "@/components/ui/sentence-filter";

describe("navigation controls", () => {
  it("shows tab counts and reports the picked tab", async () => {
    const onValueChange = vi.fn();
    render(
      <Tabs
        ariaLabel="Profile sections"
        value="diary"
        onValueChange={onValueChange}
        items={[
          { value: "diary", label: "Diary", count: 312 },
          { value: "reviews", label: "Reviews", count: 85 },
        ]}
      />,
    );

    expect(screen.getByRole("tab", { name: "Diary 312" })).toHaveAttribute("aria-selected", "true");
    await userEvent.click(screen.getByRole("tab", { name: "Reviews 85" }));
    expect(onValueChange).toHaveBeenCalledWith("reviews");
  });

  it("picks one segment at a time", async () => {
    const onValueChange = vi.fn();
    render(
      <Segmented
        ariaLabel="Media"
        value="films"
        onValueChange={onValueChange}
        options={[
          { value: "films", label: "Films" },
          { value: "tv", label: "TV" },
        ]}
      />,
    );

    expect(screen.getByRole("radio", { name: "Films" })).toHaveAttribute("aria-checked", "true");
    await userEvent.click(screen.getByRole("radio", { name: "TV" }));
    expect(onValueChange).toHaveBeenCalledWith("tv");
  });

  it("removes a chip", async () => {
    const onRemove = vi.fn();
    render(<Chip onRemove={onRemove}>Horror</Chip>);

    await userEvent.click(screen.getByRole("button", { name: "Remove Horror" }));
    expect(onRemove).toHaveBeenCalled();
  });

  it("opens a phrase's menu, applies the pick and closes", async () => {
    const SortSentence = () => {
      const [sort, setSort] = useState("newest");
      return (
        <SentenceFilter
          parts={[
            "Showing films, ",
            {
              key: "sort",
              label: "Sort",
              value: sort,
              onChange: setSort,
              options: [
                { value: "newest", label: "newest first" },
                { value: "rating", label: "highest rated" },
              ],
            },
            ".",
          ]}
        />
      );
    };
    render(<SortSentence />);

    await userEvent.click(screen.getByRole("button", { name: "Sort: newest first" }));
    await userEvent.click(screen.getByRole("option", { name: "highest rated" }));

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sort: highest rated" })).toBeInTheDocument();
  });

  it("closes a phrase's menu on Escape", async () => {
    render(
      <SentenceFilter
        parts={[
          {
            key: "year",
            label: "Year",
            value: "all",
            onChange: () => {},
            options: [{ value: "all", label: "every year" }],
          },
        ]}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Year: every year" }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
