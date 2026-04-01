import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { settingsSections } from "@/features/settings/model/settings.constants";

const tabClass =
  "inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors";

export const SettingsTabs = () => {
  return (
    <nav className="theme-segment-shell flex flex-wrap gap-1 rounded-xl border border-border/70 bg-card/45 p-1">
      {settingsSections.map((section) => (
        <Link
          key={section.id}
          to={section.to}
          className={cn(
            tabClass,
            "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
          )}
          activeProps={{
            className: cn(tabClass, "theme-segment-active"),
          }}
          activeOptions={{ includeSearch: false, exact: true }}
          viewTransition
        >
          {section.label}
        </Link>
      ))}
    </nav>
  );
};
