import { useEffect, useMemo, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCinemaSearchDialog } from "@/features/films/components/useCinemaSearchDialog";
import { primaryNavItems } from "./navbar.constants";

const isEditableElement = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName;
  return (
    target.isContentEditable ||
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT"
  );
};

export const useAppNavbarController = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { user, isUserLoading, logout, isLogoutPending } = useAuth();
  const { isOpen: isSearchDialogOpen, open: openCinemaSearch } =
    useCinemaSearchDialog();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const visiblePrimaryNavItems = useMemo(
    () =>
      primaryNavItems.filter((item) => {
        if (!item.adminOnly) {
          return true;
        }

        return Boolean(user?.isAdmin);
      }),
    [user?.isAdmin],
  );

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (!profileMenuRef.current) {
        return;
      }

      if (
        event.target instanceof Node &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handleOutsideClick);
    return () => {
      window.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isProfileMenuOpen]);

  useEffect(() => {
    const handleGlobalShortcuts = (event: KeyboardEvent) => {
      if (isEditableElement(event.target)) {
        return;
      }

      const loweredKey = event.key.toLowerCase();

      if ((event.metaKey || event.ctrlKey) && loweredKey === "k") {
        event.preventDefault();
        openCinemaSearch();
        setIsMobileMenuOpen(false);
        setIsProfileMenuOpen(false);
        return;
      }

      if (event.key === "/") {
        event.preventDefault();
        openCinemaSearch();
        setIsMobileMenuOpen(false);
        setIsProfileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => {
      window.removeEventListener("keydown", handleGlobalShortcuts);
    };
  }, [openCinemaSearch]);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const closeProfileMenu = () => {
    setIsProfileMenuOpen(false);
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen((current) => !current);
  };

  const toggleMobileMenu = () => {
    setIsProfileMenuOpen(false);
    setIsMobileMenuOpen((current) => !current);
  };

  const openSearchDialog = () => {
    openCinemaSearch();
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } finally {
      closeMobileMenu();
      setIsProfileMenuOpen(false);
    }
  };

  const profileImageUrl = user?.avatarUrl ?? user?.image ?? null;
  const profileInitial = user?.username.slice(0, 1).toUpperCase() ?? "U";

  return {
    user,
    isUserLoading,
    isLogoutPending,
    isSearchDialogOpen,
    isMobileMenuOpen,
    isProfileMenuOpen,
    visiblePrimaryNavItems,
    profileMenuRef,
    profileImageUrl,
    profileInitial,
    closeMobileMenu,
    closeProfileMenu,
    toggleProfileMenu,
    toggleMobileMenu,
    openSearchDialog,
    handleSignOut,
  };
};
