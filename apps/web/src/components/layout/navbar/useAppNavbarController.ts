import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useGlobalSearchDialog } from "@/features/search/components/useGlobalSearchDialog";
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
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { user, isUserLoading, logout, isLogoutPending } = useAuth();
  const { isOpen: isSearchDialogOpen, open: openGlobalSearch } =
    useGlobalSearchDialog();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const visiblePrimaryNavItems = primaryNavItems;

  useEffect(() => {
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
        openGlobalSearch();
            setIsProfileMenuOpen(false);
        return;
      }

      if (event.key === "/") {
        event.preventDefault();
        openGlobalSearch();
            setIsProfileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => {
      window.removeEventListener("keydown", handleGlobalShortcuts);
    };
  }, [openGlobalSearch]);

  const closeProfileMenu = () => {
    setIsProfileMenuOpen(false);
  };

  const openProfileMenu = () => {
    setIsProfileMenuOpen(true);
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen((current) => !current);
  };

  const openSearchDialog = () => {
    openGlobalSearch();
    setIsProfileMenuOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } finally {
      setIsProfileMenuOpen(false);
    }
  };

  const profileImageUrl = user?.avatarUrl ?? null;
  const profileInitial = user?.username.slice(0, 1).toUpperCase() ?? "U";

  return {
    user,
    isUserLoading,
    isLogoutPending,
    isSearchDialogOpen,
    isProfileMenuOpen,
    visiblePrimaryNavItems,
    pathname,
    profileMenuRef,
    profileImageUrl,
    profileInitial,
    closeProfileMenu,
    openProfileMenu,
    toggleProfileMenu,
    openSearchDialog,
    handleSignOut,
  };
};
