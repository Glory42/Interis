import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { PublicProfile } from "@/types/api";

type ProfileHeaderProps = {
  profile: PublicProfile;
};

const getHeaderBackground = (url: string | null | undefined): string | undefined =>
  url ?? undefined;

export const ProfileHeader = ({ profile }: ProfileHeaderProps) => {
  const backdropUrl = getHeaderBackground(profile.backdropUrl ?? null);

  return (
    <Card className="overflow-hidden border-border/70">
      <div className="relative h-32 bg-gradient-to-r from-secondary to-secondary/20 sm:h-44">
        {backdropUrl ? (
          <img
            src={backdropUrl}
            alt={`${profile.username} backdrop`}
            className="h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-transparent" />
      </div>

      <CardContent className="relative -mt-8 space-y-4 p-4 sm:-mt-10 sm:p-6">
        <div className="flex flex-wrap items-end gap-3 sm:gap-4">
          <img
            src={
              profile.avatarUrl ||
              "https://placehold.co/160x160/1a2142/cfd7ff?text=Avatar"
            }
            alt={`${profile.username} avatar`}
            className="h-16 w-16 rounded-xl border border-border object-cover shadow-lg sm:h-20 sm:w-20"
          />
          <div className="min-w-0 space-y-1">
            <h1 className="truncate text-[clamp(1.1rem,4.8vw,1.5rem)] font-bold text-foreground">
              @{profile.username}
            </h1>
            {profile.name ? <p className="text-sm text-muted-foreground">{profile.name}</p> : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="primary">{profile.stats?.entryCount ?? 0} diary entries</Badge>
          <Badge variant="accent">{profile.stats?.reviewCount ?? 0} reviews</Badge>
          {profile.isAdmin ? <Badge variant="default">Admin</Badge> : null}
          {profile.location ? <Badge variant="muted">{profile.location}</Badge> : null}
        </div>

        {profile.bio ? <p className="text-sm leading-7 text-muted-foreground">{profile.bio}</p> : null}
      </CardContent>
    </Card>
  );
};
