import { Search } from "lucide-react";

type DesktopSearchButtonProps = {
  isSearchDialogOpen: boolean;
  onOpen: () => void;
};

export const DesktopSearchButton = ({
  isSearchDialogOpen,
  onOpen,
}: DesktopSearchButtonProps) => (
  <div className="relative hidden items-center sm:flex">
    <Search className="pointer-events-none relative z-10 ml-3 -mr-6 h-3 w-3 text-muted-foreground/70" />
    <input
      readOnly
      type="text"
      value=""
      onClick={onOpen}
      placeholder="search..."
      aria-haspopup="dialog"
      aria-expanded={isSearchDialogOpen}
      aria-label="Open global search"
      className="surface-card w-40 py-1.5 pr-3 pl-8 font-mono text-[11px] text-foreground/80 transition-colors placeholder:text-muted-foreground/60 hover:border-[color:var(--surface-card-border-hover)] focus:border-[color:var(--surface-card-border-hover)] focus:outline-none"
    />
  </div>
);
