import { useState, type ReactNode } from "react";
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

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const Count = ({ value, label, onClick }: { value: number; label: string; onClick?: () => void }) => {
  const content = (
    <>
      <b className="font-semibold text-foreground">{value.toLocaleString("en-US")}</b> {label}
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} className="underline decoration-[color:var(--line-strong)] underline-offset-4 hover:text-foreground">
      {content}
    </button>
  ) : (
    <span>{content}</span>
  );
};

// Name, one line of counts, then only what the person filled in; nothing is padded with filler.
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
  const avatarUrl = profile.avatarUrl && profile.avatarUrl !== failedAvatarUrl ? profile.avatarUrl : null;
  const joined = profile.createdAt ? new Date(profile.createdAt) : null;
  const bio = profile.bio?.trim();
  const location = profile.location?.trim();
  const genres = profile.favoriteGenres ?? [];

  return (
    <div className="rounded-[3px] border border-[color:var(--line)]">
      <div className="slate mono-meta rounded-t-[3px] uppercase">
        <span>{`Profile · ${profile.username}`}</span>
        {joined && !Number.isNaN(joined.getTime()) ? (
          <span>{`Joined ${MONTHS[joined.getMonth()]} ${joined.getFullYear()}`}</span>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="size-16 shrink-0 rounded-full object-cover sm:size-[76px]"
            onError={() => setFailedAvatarUrl(avatarUrl)}
          />
        ) : (
          <span className="display-3 inline-flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary sm:size-[76px]">
            {profile.username.slice(0, 1).toLowerCase() || "u"}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="display-2 leading-none text-foreground">{displayName}</h1>
          <p className="mono-meta mt-2 text-muted-foreground">
            <Count value={stats.logged} label="logged" />
            {" · "}
            <Count value={stats.reviews} label="reviews" />
            {" · "}
            <Count value={stats.following} label="following" onClick={onFollowingClick} />
            {" · "}
            <Count value={stats.followers} label="followers" onClick={onFollowersClick} />
          </p>
          {bio ? <p className="body mt-2.5 max-w-xl text-foreground">{bio}</p> : null}
          {location || genres.length > 0 ? (
            <p className="body-s mt-1 text-muted-foreground">
              {location ? `◎ ${location}` : null}
              {location && genres.length > 0 ? " · " : null}
              {genres.length > 0 ? (
                <>
                  <span className="text-primary">enjoys</span> {genres.join(" · ")}
                </>
              ) : null}
            </p>
          ) : null}
          {actionError ? (
            <p className="body-s mt-3 rounded-[3px] border border-[color:var(--danger)]/40 bg-[color:var(--danger)]/10 px-3 py-2 text-[color:var(--danger)]">
              {actionError}
            </p>
          ) : null}
        </div>

        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </div>
    </div>
  );
};
