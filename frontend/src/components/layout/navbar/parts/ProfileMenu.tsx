import type { RefObject } from "react";
import { Link } from "@tanstack/react-router";
import { User } from "lucide-react";
import { dropdownItemClass } from "@/components/layout/navbar/navbar.constants";
import type { NavbarUser } from "@/components/layout/navbar/parts/types";

type ProfileMenuProps = {
  user: NavbarUser;
  isOpen: boolean;
  isLogoutPending: boolean;
  onOpen: () => void;
  onToggle: () => void;
  onClose: () => void;
  onSignOut: () => void | Promise<void>;
  menuRef: RefObject<HTMLDivElement | null>;
};

export const ProfileMenu = ({
  user,
  isOpen,
  isLogoutPending,
  onOpen,
  onToggle,
  onClose,
  onSignOut,
  menuRef,
}: ProfileMenuProps) => (
  <div ref={menuRef} className="relative" onMouseEnter={onOpen}>
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-1.5 border border-border/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-all hover:text-foreground"
      aria-haspopup="menu"
      aria-expanded={isOpen}
      aria-label="Open profile menu"
    >
      <User className="h-3 w-3" />
      <span className="hidden sm:inline">{user.username}</span>
    </button>

    {isOpen ? (
      <div
        className="absolute right-0 top-[calc(100%+0.35rem)] z-50 w-44 border border-border/80 bg-popover/95 p-1 backdrop-blur-md animate-fade-up"
        role="menu"
        aria-label="Profile options"
      >
        <Link
          to="/profile/$username"
          params={{ username: user.username }}
          viewTransition
          className={dropdownItemClass}
          onClick={onClose}
        >
          Profile
        </Link>
        <Link
          to="/settings"
          viewTransition
          className={dropdownItemClass}
          onClick={onClose}
        >
          Settings
        </Link>
        <button
          type="button"
          onClick={onSignOut}
          disabled={isLogoutPending}
          className={dropdownItemClass}
        >
          {isLogoutPending ? "Signing out" : "Sign out"}
        </button>
      </div>
    ) : null}
  </div>
);
