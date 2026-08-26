import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

// The auth-gated "toggle" button pattern repeated across every media type's
// actions sidebar (watchlist/watched/liked for movies, want-to-read/liked
// for books, etc.) - not authenticated shows a login link, authenticated
// shows a clickable state toggle. Which actions exist per media type stays
// with each sidebar; this only owns the one repeated button shape.
export type MediaActionButtonProps = {
  icon: LucideIcon;
  activeIcon?: LucideIcon;
  label: string;
  activeLabel?: string;
  isAuthenticated: boolean;
  isActive?: boolean;
  disabled?: boolean;
  onClick: () => void;
  accentColor: string;
  mutedColor: string;
  borderColor: string;
  className?: string;
};

export const MediaActionButton = ({
  icon: Icon,
  activeIcon: ActiveIcon,
  label,
  activeLabel,
  isAuthenticated,
  isActive = false,
  disabled = false,
  onClick,
  accentColor,
  mutedColor,
  borderColor,
  className,
}: MediaActionButtonProps) => {
  const DisplayIcon = isActive && ActiveIcon ? ActiveIcon : Icon;
  const displayLabel = isActive ? (activeLabel ?? label) : label;
  const baseClassName =
    className ??
    "flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors disabled:cursor-not-allowed disabled:opacity-60";

  if (!isAuthenticated) {
    return (
      <Link
        to="/login"
        className={baseClassName}
        style={{ borderColor, color: mutedColor }}
        viewTransition
      >
        <Icon className="h-3 w-3" />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={baseClassName}
      style={{
        borderColor: isActive ? accentColor : borderColor,
        color: isActive ? accentColor : mutedColor,
        background: "transparent",
      }}
    >
      <DisplayIcon className="h-3 w-3" />
      <span>{displayLabel}</span>
    </button>
  );
};
