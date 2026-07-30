import { useState, type RefObject } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { dropdownItemClass } from "@/components/layout/navbar/navbar.constants";
import { NavbarThemeSubmenu } from "@/components/layout/navbar/parts/NavbarThemeSubmenu";
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
  const [failedProfileImageUrl, setFailedProfileImageUrl] = useState<string | null>(null);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const shouldShowProfileImage = Boolean(
    profileImageUrl && profileImageUrl !== failedProfileImageUrl,
  );

  return (
    <div ref={menuRef} className="relative self-stretch flex items-center" onMouseEnter={onOpen}>
      <button
        type="button"
        onClick={onToggle}
        className="flex max-w-[10rem] items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Open profile menu"
      >
        {shouldShowProfileImage ? (
          <img
            src={profileImageUrl ?? undefined}
            alt={`${user.username} avatar`}
            className="h-4 w-4 rounded-full border object-cover"
            style={{ borderColor: "var(--theme-pill-border)" }}
            onError={() => {
              setFailedProfileImageUrl(profileImageUrl);
            }}
          />
        ) : (
          <span
            className="inline-flex h-4 w-4 items-center justify-center rounded-full border text-[9px] font-bold"
            style={{
              borderColor: "var(--theme-pill-border)",
              background: "var(--theme-pill-bg)",
              color: "var(--theme-pill-text)",
            }}
          >
            {profileInitial}
          </span>
        )}
        <span className="hidden max-w-[5.5rem] truncate sm:inline">{user.username}</span>
      </button>

      {isOpen ? (
        <div
          className="absolute right-0 top-[calc(100%-1px)] z-50 w-44 rounded-xl border bg-popover/95 p-1 backdrop-blur-md animate-fade-up"
          style={{ borderColor: "color-mix(in srgb, var(--primary) 30%, transparent)" }}
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
          {user.isAdmin ? (
            <Link
              to="/admin"
              viewTransition
              className={dropdownItemClass}
              onClick={onClose}
            >
              Admin
            </Link>
          ) : null}
          <div>
            <button
              type="button"
              onClick={() => setIsThemeMenuOpen((prev) => !prev)}
              className={dropdownItemClass + " justify-between"}
            >
              Theme
              <ChevronRight
                size={10}
                className={"text-muted-foreground/60 transition-transform duration-200 " + (isThemeMenuOpen ? "rotate-90" : "")}
              />
            </button>
            {isThemeMenuOpen ? (
              <NavbarThemeSubmenu />
            ) : null}
          </div>
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
