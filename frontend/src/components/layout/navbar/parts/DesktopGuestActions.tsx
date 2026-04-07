import { Link } from "@tanstack/react-router";
import { LogIn, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

export const DesktopGuestActions = () => (
  <div className="hidden items-center gap-1 md:flex">
    <Button
      asChild
      variant="ghost"
      size="sm"
      className="h-7 px-2.5 text-muted-foreground"
    >
      <Link to="/login" viewTransition>
        <LogIn className="h-3.5 w-3.5" />
        LOGIN
      </Link>
    </Button>
    <Button asChild size="sm" className="h-7 px-2.5">
      <Link to="/register" viewTransition>
        <UserRound className="h-3.5 w-3.5" />
        REGISTER
      </Link>
    </Button>
  </div>
);
