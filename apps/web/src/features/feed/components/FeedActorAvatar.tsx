import { useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

type FeedActorAvatarProps = {
  avatarUrl: string | null;
  username: string;
  initial: string;
  className?: string;
  style?: CSSProperties;
  // "circle" is used by the feed's own editorial layout; "square" keeps the
  // original look for any other caller that doesn't opt in.
  shape?: "square" | "circle";
};

export const FeedActorAvatar = ({
  avatarUrl,
  username,
  initial,
  className,
  style,
  shape = "square",
}: FeedActorAvatarProps) => {
  const [isFailed, setIsFailed] = useState(false);
  const shouldShowImage = Boolean(avatarUrl && !isFailed);

  const baseClassName =
    className ?? "flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden border";

  return (
    <div
      className={cn(baseClassName, shape === "circle" && "rounded-full")}
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
        <span
          className="text-xs font-bold"
          style={{ fontFamily: "var(--theme-display-font)" }}
        >
          {initial}
        </span>
      )}
    </div>
  );
};
