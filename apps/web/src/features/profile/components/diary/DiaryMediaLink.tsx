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

  if (row.channel === "movie" && row.tmdbId !== null) {
    return (
      <Link
        to="/movies/$tmdbId"
        params={{ tmdbId: String(row.tmdbId) }}
        className={className}
        viewTransition
      >
        {children}
      </Link>
    );
  }

  return <span className={className}>{children}</span>;
};
