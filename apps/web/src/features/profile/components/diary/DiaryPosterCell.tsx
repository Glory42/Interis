import { useState } from "react";
import { toPosterFallbackLabel } from "./diary-model";
import { getPosterUrl } from "@/features/media/tmdb-images";

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
      className="flex h-14 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border"
      style={{
        borderColor: "var(--shell-row-border)",
        background: "color-mix(in srgb, var(--shell-bg) 85%, black)",
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
        <span className="px-0.5 text-center font-mono text-[7px] leading-tight shell-muted">
          {toPosterFallbackLabel(title)}
        </span>
      )}
    </div>
  );
};
