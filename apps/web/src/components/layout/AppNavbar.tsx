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
    openProfileMenu,
    toggleProfileMenu,
    toggleMobileMenu,
    openSearchDialog,
    handleSignOut,
  } = useAppNavbarController();

  return (
    <>
      <header className="theme-navbar-shell sticky top-0 z-40 border-b border-border/70">
        <div
          className="pointer-events-none h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, color-mix(in srgb, var(--primary) 30%, transparent), transparent)",
          }}
        />

        <div className="mx-auto grid h-12 w-full max-w-400 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-4">
          <div className="col-start-1 flex min-w-0 items-center">
            <NavbarBrand />
          </div>

          <nav className="col-start-2 hidden min-w-0 items-center justify-center gap-1 md:flex">
            <PrimaryNavLinks items={visiblePrimaryNavItems} />
          </nav>

          <div className="col-start-3 flex min-w-0 items-center justify-end gap-3">
            <DesktopSearchButton
              isSearchDialogOpen={isSearchDialogOpen}
              onOpen={openSearchDialog}
            />

            {isUserLoading ? (
              <span className="hidden font-mono text-[10px] text-muted-foreground lg:inline">
                LOADING
              </span>
            ) : null}

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

            <MobileMenuToggle
              isOpen={isMobileMenuOpen}
              onToggle={toggleMobileMenu}
            />
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
          className="theme-navbar-overlay fixed inset-0 top-12 z-30 bg-black/45 md:hidden"
          aria-label="Close navigation overlay"
        />
      ) : null}
    </>
  );
};
