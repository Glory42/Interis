import type { UserSearchResult } from "@/features/profile/api";
import { cn } from "@/lib/utils";

type CinemaSearchUserResultItemProps = {
  inputId: string;
  index: number;
  profile: UserSearchResult;
  isHighlighted: boolean;
  onHover: (index: number) => void;
  onSelect: (username: string) => void;
};

export const CinemaSearchUserResultItem = ({
  inputId,
  index,
  profile,
  isHighlighted,
  onHover,
  onSelect,
}: CinemaSearchUserResultItemProps) => {
  const profileAvatar = profile.avatarUrl ?? profile.image ?? null;
  const profileName = profile.displayUsername?.trim() || profile.username;

  return (
    <li>
      <button
        id={`${inputId}-result-${index}`}
        type="button"
        role="option"
        aria-selected={isHighlighted}
        className={cn(
          "grid w-full grid-cols-[42px_1fr] gap-2 border px-2 py-2 text-left transition-colors",
          isHighlighted
            ? "border-primary/45 bg-primary/12"
            : "border-border/75 bg-background/30 hover:bg-secondary/40",
        )}
        onMouseEnter={() => onHover(index)}
        onClick={() => onSelect(profile.username)}
      >
        {profileAvatar ? (
          <img
            src={profileAvatar}
            alt={`${profile.username} avatar`}
            className="h-10 w-10 border border-border/60 object-cover"
            loading="lazy"
          />
        ) : (
          <span className="inline-flex h-10 w-10 items-center justify-center border border-border/60 bg-secondary text-xs font-semibold text-secondary-foreground">
            {profile.username.slice(0, 1).toUpperCase()}
          </span>
        )}

        <span className="space-y-0.5">
          <span className="line-clamp-1 block text-sm font-semibold text-foreground">
            {profileName}
          </span>
          <span className="block text-xs text-muted-foreground">@{profile.username}</span>
        </span>
      </button>
    </li>
  );
};
