import {
  DesktopGuestActions,
  DesktopSearchButton,
  MobileMenu,
  MobileMenuToggle,
  NavbarBrand,
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
  } = useAppNavbarController();

  return (
    <>
      <header className="theme-navbar-shell sticky top-0 z-50 border-b border-border/40 bg-background/85 backdrop-blur-2xl">
        <div className="mx-auto grid h-14 w-full max-w-7xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-4">
          <NavbarBrand />

          <nav className="hidden min-w-0 items-center justify-center gap-1 md:flex">
            <PrimaryNavLinks items={visiblePrimaryNavItems} />
          </nav>

          <div className="flex min-w-0 items-center justify-end gap-3">
            <DesktopSearchButton
              isSearchDialogOpen={isSearchDialogOpen}
              onOpen={openSearchDialog}
            />

            {isUserLoading ? (
              <span className="hidden text-xs text-muted-foreground lg:inline">
                Loading session...
              </span>
            ) : null}

            {user ? (
              <ProfileMenu
                user={user}
                profileImageUrl={profileImageUrl}
                profileInitial={profileInitial}
                isOpen={isProfileMenuOpen}
                isLogoutPending={isLogoutPending}
                onToggle={toggleProfileMenu}
                onClose={closeProfileMenu}
                onSignOut={handleSignOut}
                menuRef={profileMenuRef}
              />
            ) : null}

            {!isUserLoading && !user ? <DesktopGuestActions /> : null}

            <MobileMenuToggle isOpen={isMobileMenuOpen} onToggle={toggleMobileMenu} />
          </div>
        </div>

        <MobileMenu
          isOpen={isMobileMenuOpen}
          isUserLoading={isUserLoading}
          user={user}
          visiblePrimaryNavItems={visiblePrimaryNavItems}
          isLogoutPending={isLogoutPending}
          onClose={closeMobileMenu}
          onOpenSearch={openSearchDialog}
          onSignOut={handleSignOut}
        />
      </header>

      {isMobileMenuOpen ? (
        <button
          type="button"
          onClick={closeMobileMenu}
          className="theme-navbar-overlay fixed inset-0 top-14 z-40 bg-background/45 md:hidden"
          aria-label="Close navigation overlay"
        />
      ) : null}
    </>
  );
};
