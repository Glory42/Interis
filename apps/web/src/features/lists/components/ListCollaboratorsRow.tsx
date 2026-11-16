import { Link } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedActorAvatar } from "@/features/feed/components/FeedActorAvatar";
import type { ListCollaborator } from "@/features/lists/api";

type ListCollaboratorsRowProps = {
  collaborators: ListCollaborator[];
  canManage: boolean;
  onManage: () => void;
};

// The List Collaborators who have joined, and the owner's way in to managing them.
export const ListCollaboratorsRow = ({ collaborators, canManage, onManage }: ListCollaboratorsRowProps) => {
  const joined = collaborators.filter((c) => c.status === "accepted");
  const pending = collaborators.length - joined.length;
  if (joined.length === 0 && !canManage) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      {joined.length > 0 ? (
        <div className="flex items-center gap-2">
          <span className="mono-meta uppercase text-muted-foreground">With</span>
          <ul aria-label="Collaborators" className="flex -space-x-1.5">
            {joined.map((person) => (
              <li key={person.userId}>
                <Link to="/profile/$username" params={{ username: person.username }} title={person.username}>
                  <FeedActorAvatar
                    avatarUrl={person.avatarUrl}
                    username={person.username}
                    initial={person.username.slice(0, 1).toUpperCase()}
                    className="flex size-6 items-center justify-center overflow-hidden border border-[color:var(--line)] bg-card"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {canManage ? (
        <Button variant="outline" size="sm" onClick={onManage}>
          <Users aria-hidden className="size-3.5" />
          {pending > 0 ? `Manage collaborators · ${pending} invited` : "Manage collaborators"}
        </Button>
      ) : null}
    </div>
  );
};
