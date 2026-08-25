type MobileMenuToggleProps = {
  isOpen: boolean;
  onToggle: () => void;
};

export const MobileMenuToggle = ({
  isOpen,
  onToggle,
}: MobileMenuToggleProps) => (
  <button
    type="button"
    onClick={onToggle}
    className="rounded-full px-2 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 md:hidden"
    aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
    aria-expanded={isOpen}
    aria-haspopup="menu"
  >
    MENU
  </button>
);
