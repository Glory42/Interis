import { useMemo, useState } from "react";
import { Globe, Share2 } from "lucide-react";

type ProfileSidebarProps = {
  username: string;
  location: string | null | undefined;
  joinedLabel: string;
  lastActiveLabel: string;
  favoriteGenres: string[];
};

export const ProfileSidebar = ({
  username,
  location,
  joinedLabel,
  lastActiveLabel,
  favoriteGenres,
}: ProfileSidebarProps) => {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
    "idle",
  );

  const profileUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return `/profile/${encodeURIComponent(username)}`;
    }

    return `${window.location.origin}/profile/${encodeURIComponent(username)}`;
  }, [username]);

  const copyProfileUrl = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  };

  const shareProfile = async () => {
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      try {
        await navigator.share({
          title: `@${username} on NULL://LOG`,
          url: profileUrl,
        });
        return;
      } catch {
        return;
      }
    }

    await copyProfileUrl();
  };

  return (
    <aside className="space-y-6">
      <section className="border border-border/70 bg-card/65 p-5">
        <h3 className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          About
        </h3>
        <div className="space-y-3 text-sm">
          <div>
            <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
              Location
            </p>
            <p className="flex items-center gap-2 font-mono text-xs text-foreground">
              <Globe className="h-3 w-3" aria-hidden="true" />
              {location ?? "Not set"}
            </p>
          </div>
          <div>
            <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
              Member Since
            </p>
            <p className="font-mono text-xs text-foreground">{joinedLabel}</p>
          </div>
          <div>
            <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
              Last Active
            </p>
            <p className="font-mono text-xs text-foreground">
              {lastActiveLabel}
            </p>
          </div>
        </div>
      </section>

      <section className="border border-border/70 bg-card/65 p-5">
        <h3 className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Favorite Genres
        </h3>

        {favoriteGenres.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {favoriteGenres.map((genre) => (
              <span
                key={genre}
                className="border border-primary/25 bg-primary/10 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-primary"
              >
                {genre}
              </span>
            ))}
          </div>
        ) : (
          <p className="font-mono text-xs text-muted-foreground">
            No favorite genres selected yet.
          </p>
        )}
      </section>

      <section className="border border-border/70 bg-card/65 p-5">
        <h3 className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Share Profile
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              void shareProfile();
            }}
            className="flex-1 border border-border/70 bg-secondary px-2 py-2 font-mono text-[10px] text-foreground transition-colors hover:bg-secondary/80"
            aria-label="Share profile"
          >
            <Share2 className="mx-auto h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => {
              void copyProfileUrl();
            }}
            className="flex-1 border border-border/70 bg-secondary px-2 py-2 font-mono text-[10px] text-foreground transition-colors hover:bg-secondary/80"
          >
            {copyStatus === "copied"
              ? "Copied"
              : copyStatus === "error"
                ? "Copy failed"
                : "Copy Link"}
          </button>
        </div>
      </section>
    </aside>
  );
};
