import { useState } from "react";
import { Ellipsis } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ListRole } from "@/features/lists/api";
import { cn } from "@/lib/utils";

const menuItem = "block w-full px-4 py-2 text-left text-xs text-muted-foreground hover:bg-foreground/5 hover:text-foreground";

type Action = { label: string; onSelect: () => void; isDestructive?: boolean };

type ListDetailActionsMenuProps = {
  role: ListRole;
  onEdit: () => void;
  onManageCollaborators: () => void;
  onDelete: () => void;
  onLeave: () => void;
  onReport: () => void;
};

// The owner manages the List; a collaborator only edits entries or leaves; anyone else can report it.
export const ListDetailActionsMenu = ({
  role,
  onEdit,
  onManageCollaborators,
  onDelete,
  onLeave,
  onReport,
}: ListDetailActionsMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions: Action[] =
    role === "owner"
      ? [
          { label: "Edit", onSelect: onEdit },
          { label: "Manage collaborators", onSelect: onManageCollaborators },
          { label: "Delete", onSelect: onDelete, isDestructive: true },
        ]
      : role === "collaborator"
        ? [
            { label: "Edit entries", onSelect: onEdit },
            { label: "Leave list", onSelect: onLeave, isDestructive: true },
          ]
        : [{ label: "Report list", onSelect: onReport }];

  return (
    <div
      className="relative"
      onBlur={(event) => !event.currentTarget.contains(event.relatedTarget) && setIsOpen(false)}
      onKeyDown={(event) => event.key === "Escape" && setIsOpen(false)}
    >
      <Button
        variant="icon"
        size="md"
        aria-label="List actions"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <Ellipsis aria-hidden className="size-4" />
      </Button>
      {isOpen ? (
        <div role="menu" className="surface-card absolute top-full right-0 z-40 mt-1 min-w-40 overflow-hidden">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              role="menuitem"
              className={cn(menuItem, action.isDestructive && "text-[color:var(--danger)]")}
              onClick={() => {
                setIsOpen(false);
                action.onSelect();
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};
