import { useState } from "react";
import { AdminDiaryPanel } from "@/features/admin/components/AdminDiaryPanel";
import { AdminPostsPanel } from "@/features/admin/components/AdminPostsPanel";
import { AdminReviewsPanel } from "@/features/admin/components/AdminReviewsPanel";

const SUB_TABS = [
  { value: "reviews", label: "Reviews" },
  { value: "diary", label: "Diary" },
  { value: "posts", label: "Posts" },
] as const;

type ContentSubTab = (typeof SUB_TABS)[number]["value"];

export const AdminContentPanel = () => {
  const [subTab, setSubTab] = useState<ContentSubTab>("reviews");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {SUB_TABS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setSubTab(option.value)}
            className={
              "border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors " +
              (subTab === option.value
                ? "border-primary/45 bg-primary/10 text-primary"
                : "border-border/70 text-muted-foreground hover:text-foreground")
            }
          >
            {option.label}
          </button>
        ))}
      </div>

      {subTab === "reviews" ? <AdminReviewsPanel /> : null}
      {subTab === "diary" ? <AdminDiaryPanel /> : null}
      {subTab === "posts" ? <AdminPostsPanel /> : null}
    </div>
  );
};
