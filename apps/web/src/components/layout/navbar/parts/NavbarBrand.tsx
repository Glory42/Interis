import { Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/layout/BrandMark";

export const NavbarBrand = () => (
  <div className="shrink-0">
    <Link
      to="/"
      viewTransition
      className="group flex shrink-0 items-center gap-2"
    >
      <BrandMark className="h-4 w-4 shrink-0" />
      <span className="font-mono text-[11px] font-extrabold tracking-widest text-foreground/80 transition-colors group-hover:text-foreground">
        Interis
      </span>
    </Link>
  </div>
);
