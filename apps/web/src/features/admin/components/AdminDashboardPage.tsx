import { useState } from "react";
import { AdminContentPanel } from "@/features/admin/components/AdminContentPanel";
import { AdminMediaPanel } from "@/features/admin/components/AdminMediaPanel";
import { AdminReportsPanel } from "@/features/admin/components/AdminReportsPanel";
import { AdminUsersPanel } from "@/features/admin/components/AdminUsersPanel";

const TABS = [
  { value: "reports", label: "Reports" },
  { value: "users", label: "Users" },
  { value: "content", label: "Content" },
  { value: "media", label: "Media" },
] as const;

type AdminTab = (typeof TABS)[number]["value"];

export const AdminDashboardPage = () => {
  const [tab, setTab] = useState<AdminTab>("reports");

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        {TABS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setTab(option.value)}
            className={
              "border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors " +
              (tab === option.value
                ? "border-primary/45 bg-primary/10 text-primary"
                : "border-border/70 text-muted-foreground hover:text-foreground")
            }
          >
            {option.label}
          </button>
        ))}
      </div>

      {tab === "reports" ? <AdminReportsPanel /> : null}
      {tab === "users" ? <AdminUsersPanel /> : null}
      {tab === "content" ? <AdminContentPanel /> : null}
      {tab === "media" ? <AdminMediaPanel /> : null}
    </div>
  );
};
