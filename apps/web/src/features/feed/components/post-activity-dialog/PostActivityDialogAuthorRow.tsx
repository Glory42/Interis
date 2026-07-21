import { Link } from "@tanstack/react-router";
import { FeedActorAvatar } from "@/features/feed/components/FeedActorAvatar";
import { getRelativeTime } from "@/features/feed/components/feed-row.utils";

type PostActivityDialogAuthorRowProps = {
  actorAvatar: string | null;
  actorInitial: string;
  actorName: string;
  actorUsername: string;
  createdAt: string;
};

export const PostActivityDialogAuthorRow = ({
  actorAvatar,
  actorInitial,
  actorName,
  actorUsername,
  createdAt,
}: PostActivityDialogAuthorRowProps) => {
  return (
    <div className="flex items-center gap-3">
      <Link to="/profile/$username" params={{ username: actorUsername }} viewTransition>
        <FeedActorAvatar
          avatarUrl={actorAvatar}
          username={actorUsername}
          initial={actorInitial}
          className="flex h-8 w-8 items-center justify-center overflow-hidden border border-border/70 transition-opacity hover:opacity-80"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          to="/profile/$username"
          params={{ username: actorUsername }}
          className="block truncate font-mono text-xs font-bold text-foreground transition-colors hover:text-primary"
          viewTransition
        >
          {actorName}
        </Link>
        <p className="font-mono text-[10px] text-muted-foreground">
          @{actorUsername} · {getRelativeTime(createdAt)}
        </p>
      </div>
    </div>
  );
};
