import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import type { YearReviewTitle } from "../api";

type StoryTitleLinkProps = {
  title: YearReviewTitle;
  className?: string;
  children: ReactNode;
};

export const StoryTitleLink = ({ title, className, children }: StoryTitleLinkProps) =>
  title.mediaType === "movie" ? (
    <Link
      to="/movies/$tmdbId"
      params={{ tmdbId: String(title.tmdbId) }}
      className={className}
      viewTransition
    >
      {children}
    </Link>
  ) : (
    <Link
      to="/serials/$tmdbId"
      params={{ tmdbId: String(title.tmdbId) }}
      className={className}
      viewTransition
    >
      {children}
    </Link>
  );
