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
    <Search className="pointer-events-none relative z-10 ml-2 -mr-5 h-3 w-3 text-muted-foreground/70" />
    <input
      readOnly
      type="text"
      value=""
      onClick={onOpen}
      onFocus={onOpen}
      placeholder="search..."
      aria-haspopup="dialog"
      aria-expanded={isSearchDialogOpen}
      aria-label="Open cinema search"
      className="w-36 border border-border/70 bg-background/45 py-1.5 pr-3 pl-7 font-mono text-[11px] text-foreground/80 transition-colors placeholder:text-muted-foreground/60 focus:w-48 focus:border-border focus:outline-none"
      style={{ transition: "width 0.2s, border-color 0.2s" }}
    />
  </div>
);
