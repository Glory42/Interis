import { Link } from "@tanstack/react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";

export const AppFooter = () => {
  const { user } = useAuth();

  return (
    <footer className="border-t border-border/70">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-5 px-4 py-10 sm:flex-row sm:gap-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <img
            src="/icon.svg"
            alt=""
            aria-hidden
            className="h-5 w-5 rounded-sm"
          />
          <span className="text-base font-black uppercase italic tracking-tight text-foreground">
            Arkheion
          </span>
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          Universal review protocol. Documenting creative artifacts for the
          eternal record.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          <Link to="/" className="hover:text-primary" viewTransition>
            Feed
          </Link>
          <Link to="/cinema" className="hover:text-primary" viewTransition>
            Cinema
          </Link>
          <Link to="/settings" className="hover:text-primary" viewTransition>
            Settings
          </Link>
          {user ? (
            <Link
              to="/profile/$username"
              params={{ username: user.username }}
              className="hover:text-primary"
              viewTransition
            >
              Profile
            </Link>
          ) : (
            <Link to="/login" className="hover:text-primary" viewTransition>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </footer>
  );
};
