import { Link } from "@tanstack/react-router";
import { Terminal } from "lucide-react";

export const NavbarBrand = () => (
  <div className="shrink-0">
    <Link to="/" viewTransition className="group flex shrink-0 items-center gap-2">
      <div className="flex h-6 w-6 items-center justify-center border border-primary/40 bg-primary/10 text-primary transition-all group-hover:border-primary">
        <Terminal className="h-3.5 w-3.5 text-current" />
      </div>
      <span className="font-mono text-[11px] font-bold tracking-widest text-foreground/80 transition-colors group-hover:text-foreground">
        NULL<span className="text-primary">://</span>LOG
      </span>
    </Link>
  </div>
);
