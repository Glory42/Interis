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
      <FeedActorAvatar
        avatarUrl={actorAvatar}
        username={actorUsername}
        initial={actorInitial}
        className="flex h-8 w-8 items-center justify-center overflow-hidden border border-border/70"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-xs font-bold text-foreground">{actorName}</p>
        <p className="font-mono text-[10px] text-muted-foreground">
          @{actorUsername} · {getRelativeTime(createdAt)}
        </p>
      </div>
    </div>
  );
};
