import { useEffect, useRef, useState, type ComponentType } from "react";
import { Link } from "@tanstack/react-router";
import {
  ChevronDown,
  Clapperboard,
  Film,
  Home,
  LogIn,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Shield,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { cn } from "@/lib/utils";

const linkBaseClass =
  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary/80 hover:text-foreground";

const signOutPopLines = [
  "Are you leaving me? :(",
  "Nooo... the credits are not rolling yet.",
  "One more scene together maybe?",
] as const;

const randomSignOutLine = (): string => {
  return signOutPopLines[Math.floor(Math.random() * signOutPopLines.length)] ?? signOutPopLines[0];
};

type SidebarLinkProps = {
  to: "/" | "/films" | "/admin";
  label: string;
  icon: ComponentType<{ className?: string }>;
  isCollapsed: boolean;
  onNavigate?: () => void;
};

const SidebarLink = ({
  to,
  label,
  icon: Icon,
  isCollapsed,
  onNavigate,
}: SidebarLinkProps) => (
  <Link
    to={to}
    onClick={onNavigate}
    viewTransition
    startTransition
    className={cn(linkBaseClass, isCollapsed && "justify-center px-2")}
    activeProps={{
      className: cn(
        linkBaseClass,
        "bg-secondary text-foreground",
        isCollapsed && "justify-center px-2",
      ),
    }}
  >
    <Icon className="h-4 w-4 shrink-0" />
    <span className={cn("truncate", isCollapsed && "hidden")}>{label}</span>
  </Link>
);

export const AppSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSignOutPromptOpen, setIsSignOutPromptOpen] = useState(false);
  const [signOutLine, setSignOutLine] = useState<string>(signOutPopLines[0]);

  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const { user, isUserLoading, logout, isLogoutPending } = useAuth();

  const closeMobile = () => {
    setIsMobileOpen(false);
    setIsUserMenuOpen(false);
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!userMenuRef.current) {
        return;
      }

      if (event.target instanceof Node && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const openSignOutPrompt = () => {
    setIsUserMenuOpen(false);
    setSignOutLine(randomSignOutLine());
    setIsSignOutPromptOpen(true);
  };

  const handleConfirmSignOut = async () => {
    try {
      await logout();
      setIsSignOutPromptOpen(false);
      closeMobile();
    } catch {
      setIsSignOutPromptOpen(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsMobileOpen(true)}
        className="fixed left-4 top-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-foreground shadow-lg md:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {isMobileOpen ? (
        <button
          type="button"
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm md:hidden"
          aria-label="Close sidebar backdrop"
        />
      ) : null}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-border/80 bg-card/95 backdrop-blur-xl transition-[width,transform] duration-300",
          isCollapsed ? "w-20" : "w-72",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex items-center justify-between border-b border-border/70 px-4 py-4">
          <Link
            to="/"
            onClick={closeMobile}
            viewTransition
            startTransition
            className={cn(
              "inline-flex items-center gap-2 text-sm font-semibold text-foreground",
              isCollapsed && "justify-center",
            )}
          >
            <Clapperboard className="h-5 w-5 shrink-0 text-primary" />
            <span className={cn("truncate", isCollapsed && "hidden")}>This is Cinema</span>
          </Link>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsCollapsed((value) => !value)}
              className="hidden rounded-md p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground md:inline-flex"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>

            <button
              type="button"
              onClick={closeMobile}
              className="rounded-md p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground md:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <SidebarLink
            to="/"
            label="Home"
            icon={Home}
            isCollapsed={isCollapsed}
            onNavigate={closeMobile}
          />

          <SidebarLink
            to="/films"
            label="Films"
            icon={Film}
            isCollapsed={isCollapsed}
            onNavigate={closeMobile}
          />

          {user ? (
            <div ref={userMenuRef} className="relative mt-2 md:group">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((value) => !value)}
                aria-label="Open user menu"
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2 rounded-lg border border-border/70 bg-secondary/20 px-3 py-2 text-sm text-foreground transition hover:bg-secondary/70",
                  isCollapsed && "justify-center px-2",
                )}
              >
                <UserRound className="h-4 w-4 shrink-0 text-accent" />
                <span className={cn("truncate", isCollapsed && "hidden")}>@{user.username}</span>
                <span
                  className={cn(
                    "text-[10px] uppercase tracking-[0.12em] text-muted-foreground",
                    isCollapsed && "hidden",
                  )}
                >
                  Menu
                </span>
                <ChevronDown
                  className={cn(
                    "ml-auto h-4 w-4 text-muted-foreground transition-transform",
                    isCollapsed && "hidden",
                    isUserMenuOpen && "rotate-180",
                  )}
                />
              </button>

              <div
                className={cn(
                  "absolute z-30 max-h-[70dvh] overflow-auto rounded-xl border border-border/80 bg-card p-2 shadow-xl backdrop-blur-sm transition-all duration-150 sm:max-h-96",
                  "left-full top-0 ml-2 w-56",
                  isUserMenuOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0",
                  "md:group-hover:visible md:group-hover:translate-y-0 md:group-hover:opacity-100",
                )}
              >
                <Link
                  to="/profile/$username"
                  params={{ username: user.username }}
                  onClick={closeMobile}
                  viewTransition
                  startTransition
                  className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground transition hover:bg-secondary/70"
                >
                  <UserRound className="h-4 w-4 text-accent" />
                  Profile
                </Link>

                <Link
                  to="/settings"
                  onClick={closeMobile}
                  viewTransition
                  startTransition
                  className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground transition hover:bg-secondary/70"
                >
                  <Settings className="h-4 w-4 text-primary" />
                  Settings
                </Link>

                <button
                  type="button"
                  onClick={openSignOutPrompt}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-foreground transition hover:bg-secondary/70"
                >
                  <LogOut className="h-4 w-4 text-destructive" />
                  Sign out
                </button>
              </div>
            </div>
          ) : null}

          {user?.isAdmin ? (
            <SidebarLink
              to="/admin"
              label="Admin"
              icon={Shield}
              isCollapsed={isCollapsed}
              onNavigate={closeMobile}
            />
          ) : null}
        </nav>

        <div className="space-y-3 border-t border-border/70 px-3 py-4">
          {isUserLoading ? (
            <p className={cn("px-2 text-xs text-muted-foreground", isCollapsed && "hidden")}>
              Loading session...
            </p>
          ) : null}

          {!isUserLoading && !user ? (
            <div className="space-y-2">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className={cn("w-full justify-start", isCollapsed && "justify-center")}
              >
                <Link to="/login" onClick={closeMobile} viewTransition startTransition>
                  <LogIn className="h-4 w-4" />
                  <span className={cn(isCollapsed && "hidden")}>Login</span>
                </Link>
              </Button>

              <Button
                asChild
                size="sm"
                className={cn("w-full justify-start", isCollapsed && "justify-center")}
              >
                <Link to="/register" onClick={closeMobile} viewTransition startTransition>
                  <UserRound className="h-4 w-4" />
                  <span className={cn(isCollapsed && "hidden")}>Create account</span>
                </Link>
              </Button>
            </div>
          ) : null}

        </div>
      </aside>

      {isSignOutPromptOpen ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl animate-fade-up">
            <h3 className="text-lg font-semibold text-foreground">Wait, are you leaving me? :(</h3>
            <p className="mt-2 text-sm text-muted-foreground">{signOutLine}</p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setIsSignOutPromptOpen(false)}
                disabled={isLogoutPending}
              >
                Nope, I will stay
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmSignOut}
                disabled={isLogoutPending}
              >
                {isLogoutPending ? "Okay... leaving" : "Yes, sign me out"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
