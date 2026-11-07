import { Link, type LinkProps } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export type ProfileTabEmptyStateCta = LinkProps & {
  label: string;
};

type ProfileTabEmptyStateProps = {
  isOwner: boolean;
  // What a visitor reads: one quiet sentence, no button.
  visitorText: string;
  // What the owner gets instead: one action and/or a hint.
  ownerText?: string;
  ownerAction?: ProfileTabEmptyStateCta;
};

export const ProfileTabEmptyState = ({ isOwner, visitorText, ownerText, ownerAction }: ProfileTabEmptyStateProps) => {
  if (!isOwner || (!ownerText && !ownerAction)) {
    return <p className="body-s border-t border-[color:var(--line)] pt-4 text-muted-foreground">{visitorText}</p>;
  }

  const { label, ...linkProps } = ownerAction ?? { label: "" };
  return (
    <div className="border-t border-[color:var(--line)] pt-4">
      {ownerAction ? (
        <Button asChild variant="primary" size="md">
          <Link {...linkProps}>{label}</Link>
        </Button>
      ) : null}
      {ownerText ? <p className={`body-s text-muted-foreground ${ownerAction ? "mt-2" : ""}`}>{ownerText}</p> : null}
    </div>
  );
};
