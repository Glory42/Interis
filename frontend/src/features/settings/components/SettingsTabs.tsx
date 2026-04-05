import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { settingsSections } from "@/features/settings/model/settings.constants";

const tabClass =
  "inline-flex items-center border-b-2 px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors";

export const SettingsTabs = () => {
  return (
    <nav className="flex flex-wrap gap-0 border-b border-border/60">
      {settingsSections.map((section) => (
        <Link
          key={section.id}
          to={section.to}
          className={cn(
            tabClass,
            "text-muted-foreground hover:text-foreground",
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
