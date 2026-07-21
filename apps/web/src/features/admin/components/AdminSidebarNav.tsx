import {
  Activity,
  CalendarClock,
  Film,
  Flag,
  ListOrdered,
  MessageSquare,
  FileText,
  Tv,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminSection =
  | "reports"
  | "users"
  | "reviews"
  | "diary"
  | "posts"
  | "movies"
  | "serials"
  | "lists"
  | "activities";

type SectionGroup = {
  label: string;
  items: { value: AdminSection; label: string; icon: LucideIcon }[];
};

const SECTION_GROUPS: SectionGroup[] = [
  {
    label: "Moderation",
    items: [{ value: "reports", label: "Reports", icon: Flag }],
  },
  {
    label: "Directory",
    items: [{ value: "users", label: "Users", icon: Users }],
  },
  {
    label: "Content",
    items: [
      { value: "reviews", label: "Reviews", icon: MessageSquare },
      { value: "diary", label: "Diary", icon: CalendarClock },
      { value: "posts", label: "Posts", icon: FileText },
    ],
  },
  {
    label: "Media",
    items: [
      { value: "movies", label: "Movies", icon: Film },
      { value: "serials", label: "Serials", icon: Tv },
    ],
  },
  {
    label: "Community",
    items: [
      { value: "lists", label: "Lists", icon: ListOrdered },
      { value: "activities", label: "Activities", icon: Activity },
    ],
  },
];

type AdminSidebarNavProps = {
  active: AdminSection;
  onChange: (section: AdminSection) => void;
};

export const AdminSidebarNav = ({ active, onChange }: AdminSidebarNavProps) => (
  <nav
    aria-label="Admin sections"
    className="flex gap-3 overflow-x-auto pb-2 md:sticky md:top-16 md:w-52 md:shrink-0 md:flex-col md:gap-5 md:overflow-visible md:pb-0"
  >
    {SECTION_GROUPS.map((group) => (
      <div key={group.label} className="flex shrink-0 flex-col gap-1">
        <p className="hidden px-2.5 pb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/55 md:block">
          {group.label}
        </p>
        <div className="flex shrink-0 gap-1 md:flex-col">
          {group.items.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onChange(item.value)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2 border px-3 py-1.5 text-left font-mono text-[11px] uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                  isActive
                    ? "border-primary/45 bg-primary/10 text-primary"
                    : "border-transparent text-muted-foreground hover:border-border/60 hover:bg-secondary/40 hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    ))}
  </nav>
);
