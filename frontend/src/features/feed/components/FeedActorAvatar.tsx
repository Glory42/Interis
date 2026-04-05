import { useState, type CSSProperties } from "react";

type FeedActorAvatarProps = {
  avatarUrl: string | null;
  username: string;
  initial: string;
  className?: string;
  style?: CSSProperties;
};

export const FeedActorAvatar = ({
  avatarUrl,
  username,
  initial,
  className,
  style,
}: FeedActorAvatarProps) => {
  const [isFailed, setIsFailed] = useState(false);
  const shouldShowImage = Boolean(avatarUrl && !isFailed);

  return (
    <div
      className={
        className ?? "flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden border"
      }
      style={style}
    >
      {shouldShowImage ? (
        <img
          src={avatarUrl ?? undefined}
          alt={`${username} avatar`}
          className="h-full w-full object-cover"
          onError={() => {
            setIsFailed(true);
          }}
        />
      ) : (
        <span className="font-mono text-xs font-bold">{initial}</span>
      )}
    </div>
  );
};
