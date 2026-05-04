import { useState } from "react";
import { getPosterUrl } from "@/features/films/components/utils";
import { toPosterFallbackLabel } from "./diary-model";

type DiaryPosterCellProps = {
  title: string;
  posterPath: string | null;
};

export const DiaryPosterCell = ({ title, posterPath }: DiaryPosterCellProps) => {
  const [didPosterFail, setDidPosterFail] = useState(false);
  const posterUrl = posterPath ? getPosterUrl(posterPath) : null;
  const shouldShowPoster = Boolean(posterUrl && !didPosterFail);

  return (
    <div
      className="flex h-14 w-10 shrink-0 items-center justify-center overflow-hidden border"
      style={{
        borderColor: "var(--profile-shell-row-border)",
        background: "color-mix(in srgb, var(--profile-shell-bg) 85%, black)",
      }}
    >
      {shouldShowPoster ? (
        <img
          src={posterUrl ?? undefined}
          alt={`${title} poster`}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => {
            setDidPosterFail(true);
          }}
        />
      ) : (
        <span className="px-0.5 text-center font-mono text-[7px] leading-tight profile-shell-muted">
          {toPosterFallbackLabel(title)}
        </span>
      )}
    </div>
  );
};
