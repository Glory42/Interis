import { useState } from "react";
import { AdminActivitiesPanel } from "@/features/admin/components/AdminActivitiesPanel";
import { AdminListsPanel } from "@/features/admin/components/AdminListsPanel";

const SUB_TABS = [
  { value: "lists", label: "Lists" },
  { value: "activities", label: "Activities" },
] as const;

type CommunitySubTab = (typeof SUB_TABS)[number]["value"];

export const AdminCommunityPanel = () => {
  const [subTab, setSubTab] = useState<CommunitySubTab>("lists");

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

      {subTab === "lists" ? <AdminListsPanel /> : null}
      {subTab === "activities" ? <AdminActivitiesPanel /> : null}
    </div>
  );
};
