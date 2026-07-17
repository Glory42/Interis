import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Spinner } from "@/components/ui/spinner";
import { useDetailedStats } from "@/features/profile/hooks/useProfileStats";

type ProfileStatsPageProps = {
  username: string;
};

const formatMonthLabel = (month: string): string => {
  const [year, monthNumber] = month.split("-");
  if (!year || !monthNumber) return month;
  const date = new Date(Number(year), Number(monthNumber) - 1, 1);
  return date.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
};

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 0,
  fontSize: 11,
  fontFamily: "monospace",
} as const;

const ChartSection = ({
  title,
  isEmpty,
  emptyLabel,
  children,
}: {
  title: string;
  isEmpty: boolean;
  emptyLabel: string;
  children: React.ReactNode;
}) => (
  <section className="border profile-shell-border p-5">
    <h2 className="mb-4 font-mono text-[10px] uppercase tracking-[0.16em] profile-shell-muted">
      {title}
    </h2>
    {isEmpty ? (
      <p className="py-8 text-center font-mono text-xs profile-shell-muted">{emptyLabel}</p>
    ) : (
      children
    )}
  </section>
);

export const ProfileStatsPage = ({ username }: ProfileStatsPageProps) => {
  const statsQuery = useDetailedStats(username);

  if (statsQuery.isPending) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (statsQuery.isError || !statsQuery.data) {
    return (
      <div className="border profile-shell-border p-4 font-mono text-sm profile-shell-muted">
        Could not load stats right now.
      </div>
    );
  }

  const { entriesPerMonth, ratingDistribution, topGenres, topDirectors } = statsQuery.data;

  const monthData = entriesPerMonth.map((row) => ({
    month: formatMonthLabel(row.month),
    count: row.count,
  }));

  const ratingData = ratingDistribution.map((row) => ({
    rating: String(row.rating),
    count: row.count,
  }));

  return (
    <div className="space-y-6">
      <ChartSection
        title="Entries Per Month (last 12 months)"
        isEmpty={monthData.length === 0}
        emptyLabel="No entries logged yet."
      >
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fontFamily: "monospace" }}
              stroke="var(--muted-foreground)"
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 10, fontFamily: "monospace" }}
              stroke="var(--muted-foreground)"
            />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--secondary)" }} />
            <Bar dataKey="count" fill="var(--primary)" />
          </BarChart>
        </ResponsiveContainer>
      </ChartSection>

      <ChartSection
        title="Rating Distribution"
        isEmpty={ratingData.length === 0}
        emptyLabel="No ratings logged yet."
      >
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={ratingData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="rating"
              tick={{ fontSize: 10, fontFamily: "monospace" }}
              stroke="var(--muted-foreground)"
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 10, fontFamily: "monospace" }}
              stroke="var(--muted-foreground)"
            />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--secondary)" }} />
            <Bar dataKey="count" fill="var(--primary)" />
          </BarChart>
        </ResponsiveContainer>
      </ChartSection>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <ChartSection
          title="Top Genres"
          isEmpty={topGenres.length === 0}
          emptyLabel="Not enough data yet."
        >
          <ul className="space-y-2">
            {topGenres.map((row) => (
              <li key={row.genre} className="flex items-center justify-between text-sm">
                <span className="text-foreground/90">{row.genre}</span>
                <span className="font-mono text-xs profile-shell-accent">{row.count}</span>
              </li>
            ))}
          </ul>
        </ChartSection>

        <ChartSection
          title="Top Directors"
          isEmpty={topDirectors.length === 0}
          emptyLabel="Not enough data yet."
        >
          <ul className="space-y-2">
            {topDirectors.map((row) => (
              <li key={row.director} className="flex items-center justify-between text-sm">
                <span className="text-foreground/90">{row.director}</span>
                <span className="font-mono text-xs profile-shell-accent">{row.count}</span>
              </li>
            ))}
          </ul>
        </ChartSection>
      </div>
    </div>
  );
};
