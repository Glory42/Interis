import { useState, type RefObject } from "react";
import { Link } from "@tanstack/react-router";
import { dropdownItemClass } from "@/components/layout/navbar/navbar.constants";
import type { NavbarUser } from "@/components/layout/navbar/parts/types";

type ProfileMenuProps = {
  user: NavbarUser;
  profileImageUrl: string | null;
  profileInitial: string;
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
  profileImageUrl,
  profileInitial,
  isOpen,
  isLogoutPending,
  onOpen,
  onToggle,
  onClose,
  onSignOut,
  menuRef,
}: ProfileMenuProps) => {
  const [failedProfileImageUrl, setFailedProfileImageUrl] = useState<string | null>(
    null,
  );
  const shouldShowProfileImage = Boolean(
    profileImageUrl && profileImageUrl !== failedProfileImageUrl,
  );

  return (
    <div ref={menuRef} className="relative" onMouseEnter={onOpen}>
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1.5 border border-border/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-all hover:text-foreground"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Open profile menu"
      >
        {shouldShowProfileImage ? (
          <img
            src={profileImageUrl ?? undefined}
            alt={`${user.username} avatar`}
            className="h-4 w-4 border object-cover"
            style={{ borderColor: "var(--theme-pill-border)" }}
            onError={() => {
              setFailedProfileImageUrl(profileImageUrl);
            }}
          />
        ) : (
          <span
            className="inline-flex h-4 w-4 items-center justify-center border text-[9px] font-bold"
            style={{
              borderColor: "var(--theme-pill-border)",
              background: "var(--theme-pill-bg)",
              color: "var(--theme-pill-text)",
            }}
          >
            {profileInitial}
          </span>
        )}
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
};
