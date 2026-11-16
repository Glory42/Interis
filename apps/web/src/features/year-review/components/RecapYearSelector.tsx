import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

type RecapYearSelectorProps = { username: string; years: number[]; activeYear: number };

// Past years with logs (and this one), as a row of links.
export const RecapYearSelector = ({ username, years, activeYear }: RecapYearSelectorProps) => {
  if (years.length < 2) return null;
  return (
    <nav aria-label="Year" className="flex flex-wrap gap-x-3 gap-y-1">
      {years.map((year) => (
        <Link
          key={year}
          to="/profile/$username/year/$year"
          params={{ username, year: String(year) }}
          aria-current={year === activeYear ? "page" : undefined}
          className={cn(
            "mono-meta border-b pb-px text-[11px] transition-colors",
            year === activeYear
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {year}
        </Link>
      ))}
    </nav>
  );
};
