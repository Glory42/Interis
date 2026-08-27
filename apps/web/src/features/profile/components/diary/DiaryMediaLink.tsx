import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { DiaryRow } from "./diary-model";

type DiaryMediaLinkProps = {
  row: DiaryRow;
  className?: string;
  children: ReactNode;
};

export const DiaryMediaLink = ({ row, className, children }: DiaryMediaLinkProps) => {
  if (row.channel === "serial" && row.tmdbId !== null) {
    return (
      <Link
        to="/serials/$tmdbId"
        params={{ tmdbId: String(row.tmdbId) }}
        className={className}
        viewTransition
      >
        {children}
      </Link>
    );
  }

  if (row.channel === "cinema" && row.tmdbId !== null) {
    return (
      <Link
        to="/cinema/$tmdbId"
        params={{ tmdbId: String(row.tmdbId) }}
        className={className}
        viewTransition
      >
        {children}
      </Link>
    );
  }

  if (row.mediaType === "album" && row.mbid !== null) {
    return (
      <Link to="/music/$mbid" params={{ mbid: row.mbid }} className={className} viewTransition>
        {children}
      </Link>
    );
  }

  if (row.mediaType === "track" && row.mbid !== null) {
    return (
      <Link
        to="/music/tracks/$mbid"
        params={{ mbid: row.mbid }}
        className={className}
        viewTransition
      >
        {children}
      </Link>
    );
  }

  if (row.mediaType === "book" && row.volumeId !== null) {
    return (
      <Link
        to="/books/$volumeId"
        params={{ volumeId: row.volumeId }}
        className={className}
        viewTransition
      >
        {children}
      </Link>
    );
  }

  return <span className={className}>{children}</span>;
};
