type ProfileStatsGridProps = {
  diaryEntries: number;
  followers: number;
  following: number;
  reviews: number;
  filmsLogged: number;
  lists: number;
};

type ProfileStatCardProps = {
  value: number;
  label: string;
};

const ProfileStatCard = ({ value, label }: ProfileStatCardProps) => (
  <div className="rounded-xl border border-border/55 bg-card/30 px-3 py-3 text-center">
    <p className="text-xl font-black text-foreground">{value}</p>
    <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
      {label}
    </p>
  </div>
);

export const ProfileStatsGrid = ({
  diaryEntries,
  followers,
  following,
  reviews,
  filmsLogged,
  lists,
}: ProfileStatsGridProps) => {
  return (
    <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <ProfileStatCard value={diaryEntries} label="Diary Entries" />
      <ProfileStatCard value={followers} label="Followers" />
      <ProfileStatCard value={following} label="Following" />
      <ProfileStatCard value={reviews} label="Reviews" />
      <ProfileStatCard value={filmsLogged} label="Films Logged" />
      <ProfileStatCard value={lists} label="Lists" />
    </div>
  );
};
