import { Search } from "lucide-react";
import {
  DesktopGuestActions,
  DesktopSearchButton,
  NavbarBrand,
  NotificationsBell,
  PrimaryNavLinks,
  ProfileMenu,
} from "@/components/layout/navbar/AppNavbarParts";
import { useAppNavbarController } from "@/components/layout/navbar/useAppNavbarController";

export const AppNavbar = () => {
  const {
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
  } = useAppNavbarController();

  return (
    <>
      <header className="theme-navbar-shell sticky top-0 z-40 border-b border-[color:var(--line)]">

        <div className="mx-auto grid h-11 md:h-14 w-full max-w-400 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-4">
          <div className="col-start-1 flex min-w-0 items-center">
            <NavbarBrand />
          </div>

          <nav aria-label="Main" className="relative col-start-2 hidden min-w-0 items-center justify-center gap-4 md:flex">
            <PrimaryNavLinks items={visiblePrimaryNavItems} pathname={pathname} />
          </nav>

          <div className="col-start-3 flex min-w-0 items-center justify-end gap-3 self-stretch">
            <DesktopSearchButton
              isSearchDialogOpen={isSearchDialogOpen}
              onOpen={openSearchDialog}
            />
            <button
              type="button"
              onClick={openSearchDialog}
              aria-label="Search"
              className="inline-flex size-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground sm:hidden"
            >
              <Search className="size-4" />
            </button>

            {isUserLoading ? (
              <span className="hidden font-mono text-[10px] text-muted-foreground lg:inline">
                LOADING
              </span>
            ) : null}

            {user ? <NotificationsBell /> : null}

            {user ? (
              <ProfileMenu
                user={user}
                profileImageUrl={profileImageUrl}
                profileInitial={profileInitial}
                isOpen={isProfileMenuOpen}
                isLogoutPending={isLogoutPending}
                onOpen={openProfileMenu}
                onToggle={toggleProfileMenu}
                onClose={closeProfileMenu}
                onSignOut={handleSignOut}
                menuRef={profileMenuRef}
              />
            ) : null}

            {!isUserLoading && !user ? <DesktopGuestActions /> : null}
          </div>
        </div>
      </header>
    </>
  );
};
