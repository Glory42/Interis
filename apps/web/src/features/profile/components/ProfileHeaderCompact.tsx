import { useMemo, useState, type ReactNode } from "react";
import { MapPin } from "lucide-react";
import { getProfileDisplayName } from "@/features/profile/utils/profile.utils";
import type { PublicProfile } from "@/types/api";

type ProfileHeaderCompactProps = {
  profile: PublicProfile;
  headerAction?: ReactNode;
  actionError?: string | null;
  stats: {
    logged: number;
    reviews: number;
    following: number;
    followers: number;
  };
  onFollowingClick?: () => void;
  onFollowersClick?: () => void;
};

const StatItem = ({
  value,
  label,
  isFirst,
  onClick,
}: {
  value: number;
  label: string;
  isFirst?: boolean;
  onClick?: () => void;
}) => {
  const content = (
    <>
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className="text-[10px] uppercase tracking-wide profile-shell-muted">{label}</p>
    </>
  );
  const className = `px-4 text-center first:pl-0 last:pr-0 ${onClick ? "transition-opacity hover:opacity-70" : ""}`;
  const style = isFirst ? undefined : { borderColor: "var(--profile-shell-row-border)" };

  if (!onClick) {
    return (
      <div className={`border-l first:border-l-0 ${className}`} style={style}>
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-l first:border-l-0 ${className}`}
      style={style}
    >
      {content}
    </button>
  );
};

export const ProfileHeaderCompact = ({
  profile,
  headerAction,
  actionError,
  stats,
  onFollowingClick,
  onFollowersClick,
}: ProfileHeaderCompactProps) => {
  const displayName = getProfileDisplayName(profile);
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);

  const avatarInitial = useMemo(() => {
    return profile.username.slice(0, 1).toUpperCase() || "U";
  }, [profile.username]);

  const rawAvatarUrl = profile.avatarUrl ?? null;
  const avatarUrl =
    rawAvatarUrl && rawAvatarUrl !== failedAvatarUrl ? rawAvatarUrl : null;

  const favoriteGenres = profile.favoriteGenres ?? [];
  const locationLabel = profile.location?.trim().length
    ? profile.location
    : "Unknown Galaxy";

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-start gap-5">
        <div className="shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile avatar"
              className="h-28 w-28 border-2 object-cover profile-shell-border"
              onError={() => {
                if (rawAvatarUrl) {
                  setFailedAvatarUrl(rawAvatarUrl);
                }
              }}
              style={{
                backgroundColor: "color-mix(in srgb, var(--primary) 8%, transparent)",
              }}
            />
          ) : (
            <span
              className="inline-flex h-28 w-28 items-center justify-center border-2 font-mono text-3xl font-bold profile-shell-accent profile-shell-border"
              style={{
                backgroundColor: "color-mix(in srgb, var(--primary) 8%, transparent)",
              }}
            >
              {avatarInitial.toLowerCase()}
            </span>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
            <span className="text-sm profile-shell-accent">@{profile.username}</span>
            {headerAction}
          </div>

          {actionError ? (
            <p className="mt-3 border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {actionError}
            </p>
          ) : null}

          <p className="profile-shell-bio profile-shell-muted mt-2 max-w-md text-sm leading-relaxed">
            {profile.bio?.trim().length ? profile.bio : "No bio yet."}
          </p>

          <p className="mt-2.5 flex items-center gap-1 text-xs profile-shell-muted">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
            {locationLabel}
          </p>

          {favoriteGenres.length > 0 ? (
            <p className="mt-2.5 text-xs profile-shell-muted">
              <span className="profile-shell-accent">Enjoys</span> {favoriteGenres.join(" · ")}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center">
        <StatItem value={stats.reviews} label="Reviews" isFirst />
        <StatItem value={stats.following} label="Following" onClick={onFollowingClick} />
        <StatItem value={stats.followers} label="Followers" onClick={onFollowersClick} />
        <StatItem value={stats.logged} label="Logged" />
      </div>
    </div>
  );
};
