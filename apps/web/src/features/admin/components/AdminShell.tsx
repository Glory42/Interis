import type { ReactNode } from "react";
import { Link, useMatchRoute } from "@tanstack/react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { to: "/admin", label: "Overview", exact: true },
  { to: "/admin/reports", label: "Reports", exact: false },
  { to: "/admin/users", label: "Users", exact: false },
  { to: "/admin/content", label: "Content", exact: false },
  { to: "/admin/audit", label: "Audit log", exact: false },
] as const;

// Each section is its own route, so a refresh or a shared link lands in place.
export const AdminShell = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const matchRoute = useMatchRoute();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="overflow-hidden rounded-[3px] border border-[color:var(--line)]">
        <div className="slate mono-meta uppercase">
          <span>{`Interis · Admin · @${user?.username ?? ""}`}</span>
          <span />
        </div>
        <nav aria-label="Admin sections" className="flex gap-4 overflow-x-auto border-b border-[color:var(--line)] px-4">
          {SECTIONS.map((section) => {
            const isActive = Boolean(matchRoute({ to: section.to, fuzzy: !section.exact }));
            return (
              <Link
                key={section.to}
                to={section.to}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "body-s -mb-px shrink-0 border-b-2 py-2.5",
                  isActive ? "border-[color:var(--primary)] text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {section.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
};
