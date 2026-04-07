import type { CSSProperties, ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import type { PersonLink } from "@/features/people/shared";

type PersonRouteLinkProps = {
  person: PersonLink;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

export const PersonRouteLink = ({
  person,
  className,
  style,
  children,
}: PersonRouteLinkProps) => {
  if (person.routeRole === "director") {
    return (
      <Link
        to="/director/$slug"
        params={{ slug: person.slug }}
        className={className}
        style={style}
        viewTransition
      >
        {children ?? person.name}
      </Link>
    );
  }

  return (
    <Link
      to="/actor/$slug"
      params={{ slug: person.slug }}
      className={className}
      style={style}
      viewTransition
    >
      {children ?? person.name}
    </Link>
  );
};
