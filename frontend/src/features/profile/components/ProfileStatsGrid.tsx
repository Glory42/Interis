type ProfileStatsGridProps = {
  diaryEntries: number;
  reviews: number;
  filmsLogged: number;
  lists: number;
};

type ProfileStatCardProps = {
  value: number;
  label: string;
};

const ProfileStatCard = ({ value, label }: ProfileStatCardProps) => (
  <div className="rounded-2xl border border-border/50 bg-card/30 p-5 text-center">
    <p className="text-2xl font-black text-foreground">{value}</p>
    <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
      {label}
    </p>
  </div>
);

export const ProfileStatsGrid = ({
  diaryEntries,
  reviews,
  filmsLogged,
  lists,
}: ProfileStatsGridProps) => {
  return (
    <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
      <ProfileStatCard value={diaryEntries} label="Diary Entries" />
      <ProfileStatCard value={reviews} label="Reviews" />
      <ProfileStatCard value={filmsLogged} label="Films Logged" />
      <ProfileStatCard value={lists} label="Lists" />
    </div>
  );
};
