type ProfileStatsGridProps = {
  followers: number;
  following: number;
  reviews: number;
  lists: number;
};

type ProfileStatCardProps = {
  value: number;
  label: string;
};

const ProfileStatCard = ({ value, label }: ProfileStatCardProps) => (
  <div className="border border-border/70 bg-card/65 px-3 py-2 text-center">
    <p className="font-mono text-lg font-bold text-foreground">{value}</p>
    <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
      {label}
    </p>
  </div>
);

export const ProfileStatsGrid = ({
  followers,
  following,
  reviews,
  lists,
}: ProfileStatsGridProps) => {
  return (
    <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <ProfileStatCard value={followers} label="Followers" />
      <ProfileStatCard value={following} label="Following" />
      <ProfileStatCard value={reviews} label="Reviews" />
      <ProfileStatCard value={lists} label="Lists" />
    </div>
  );
};
