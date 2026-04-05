import { Link } from "@tanstack/react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";

export const AppFooter = () => {
  const { user } = useAuth();

  return (
    <footer className="border-t border-border/70">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          NULL://LOG
        </div>

        <p className="font-mono text-[10px] text-muted-foreground">
          logged, not filtered.
        </p>

        <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          <Link to="/" className="hover:text-primary" viewTransition>
            feed
          </Link>
          <Link to="/cinema" className="hover:text-primary" viewTransition>
            cinema
          </Link>
          <Link to="/serials" className="hover:text-primary" viewTransition>
            serial
          </Link>
          {user ? (
            <Link
              to="/profile/$username"
              params={{ username: user.username }}
              className="hover:text-primary"
              viewTransition
            >
              profile
            </Link>
          ) : (
            <Link to="/login" className="hover:text-primary" viewTransition>
              login
            </Link>
          )}
        </div>
      </div>
    </footer>
  );
};
