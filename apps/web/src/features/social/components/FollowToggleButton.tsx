import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FollowToggleButtonProps = {
  username: string;
  isFollowing: boolean;
  isPending: boolean;
  onToggle: () => void;
  // e.g. "Follow back" on your own followers list.
  followLabel?: string;
};

// "Follow", or "Following" that reads "Unfollow" on hover/focus.
export const FollowToggleButton = ({
  username,
  isFollowing,
  isPending,
  onToggle,
  followLabel = "Follow",
}: FollowToggleButtonProps) => (
  <Button
    type="button"
    size="sm"
    variant={isFollowing ? "outline" : "primary"}
    disabled={isPending}
    onClick={onToggle}
    aria-label={isFollowing ? `Unfollow @${username}` : `${followLabel} @${username}`}
    className={cn(
      "group/follow min-w-22 shrink-0",
      isFollowing &&
        "hover:border-destructive/55 hover:text-destructive focus-visible:border-destructive/55 focus-visible:text-destructive",
    )}
  >
    {isFollowing ? (
      <>
        <span className="group-hover/follow:hidden group-focus-visible/follow:hidden">Following</span>
        <span className="hidden group-hover/follow:inline group-focus-visible/follow:inline">Unfollow</span>
      </>
    ) : (
      followLabel
    )}
  </Button>
);
