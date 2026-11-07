import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Ellipsis } from "lucide-react";
import { Button } from "@/components/ui/button";

type ProfileActionsProps = {
  mode: "owner" | "viewer" | "guest";
  username: string;
  isFollowing: boolean;
  isMuted: boolean;
  isBlocked: boolean;
  // Disables the controls while a follow/mute/block request is in flight.
  isBusy: boolean;
  onToggleFollow: () => void;
  onToggleMute: () => void;
  onToggleBlock: () => void;
};

const menuItem = "block w-full px-4 py-2 text-left text-xs text-muted-foreground hover:bg-foreground/5 hover:text-foreground disabled:opacity-50";

// Follow is the one main action; Mute and Block sit in ⋯. Owners get Edit profile instead.
export const ProfileActions = ({
  mode,
  username,
  isFollowing,
  isMuted,
  isBlocked,
  isBusy,
  onToggleFollow,
  onToggleMute,
  onToggleBlock,
}: ProfileActionsProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (mode === "owner") {
    return (
      <Button asChild variant="outline" size="md">
        <Link to="/settings/profile">Edit profile</Link>
      </Button>
    );
  }

  if (mode === "guest") {
    return (
      <Button asChild variant="primary" size="md">
        <Link to="/login" search={{ redirect: `/profile/${username}` }}>
          Follow
        </Link>
      </Button>
    );
  }

  const choose = (action: () => void) => () => {
    setIsMenuOpen(false);
    action();
  };

  return (
    <div
      className="flex items-center gap-2"
      onBlur={(event) => !event.currentTarget.contains(event.relatedTarget) && setIsMenuOpen(false)}
      onKeyDown={(event) => event.key === "Escape" && setIsMenuOpen(false)}
    >
      <Button
        variant={isFollowing ? "outline" : "primary"}
        size="md"
        aria-label="Follow user"
        disabled={isBusy || isBlocked}
        onClick={onToggleFollow}
      >
        {isFollowing ? "Following" : "Follow"}
      </Button>
      <div className="relative">
        <Button
          variant="icon"
          size="md"
          aria-label="More actions"
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <Ellipsis aria-hidden className="size-4" />
        </Button>
        {isMenuOpen ? (
          <div role="menu" className="surface-card absolute top-full right-0 z-40 mt-1 min-w-36 overflow-hidden">
            <button type="button" role="menuitem" aria-label={isMuted ? "Unmute user" : "Mute user"} disabled={isBusy} onClick={choose(onToggleMute)} className={menuItem}>
              {isMuted ? "Muted · unmute" : "Mute"}
            </button>
            <button type="button" role="menuitem" aria-label={isBlocked ? "Unblock user" : "Block user"} disabled={isBusy} onClick={choose(onToggleBlock)} className={menuItem}>
              {isBlocked ? "Blocked · unblock" : "Block"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
