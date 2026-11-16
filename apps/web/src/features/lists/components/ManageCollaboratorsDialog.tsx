import { useDeferredValue, useState } from "react";
import { X } from "lucide-react";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { ModalShell } from "@/components/ui/ModalShell";
import { FeedActorAvatar } from "@/features/feed/components/FeedActorAvatar";
import { useUserSearch } from "@/features/profile/hooks/useProfile";
import type { ListCollaborator } from "@/features/lists/api";
import { useInviteListCollaborator, useRemoveListCollaborator } from "@/features/lists/hooks/useListCollaborators";

// Matches MAX_LIST_COLLABORATORS on the API: invited and accepted together.
export const MAX_LIST_COLLABORATORS = 10;

type ManageCollaboratorsDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  listId: string;
  ownerId: string;
  collaborators: ListCollaborator[];
};

const pill =
  "rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export const ManageCollaboratorsDialog = ({ isOpen, ...rest }: ManageCollaboratorsDialogProps) =>
  isOpen ? <ManageCollaboratorsDialogContent {...rest} /> : null;

const ManageCollaboratorsDialogContent = ({
  onClose,
  listId,
  ownerId,
  collaborators,
}: Omit<ManageCollaboratorsDialogProps, "isOpen">) => {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim());
  const searchQuery = useUserSearch(deferredQuery, 6);
  const inviteMutation = useInviteListCollaborator(listId);
  const removeMutation = useRemoveListCollaborator(listId, undefined);

  const takenIds = new Set([ownerId, ...collaborators.map((c) => c.userId)]);
  const results = (searchQuery.data ?? []).filter((u) => !takenIds.has(u.id));
  const isFull = collaborators.length >= MAX_LIST_COLLABORATORS;

  return (
    <ModalShell onClose={onClose} layout="sheet" containerClassName="max-w-md" ariaCloseLabel="Close collaborators dialog">
      <section className="theme-modal-panel relative w-full overflow-hidden border border-border/80 bg-card/95 p-0 animate-fade-up">
        <ModalHeader title="COLLABORATORS" onClose={onClose} closeAriaLabel="Close collaborators dialog" align="start" />

        <div className="space-y-4 px-4 py-4">
          <p className="body-s text-muted-foreground">
            Collaborators can add, remove and reorder titles and edit notes. Only you can rename, change visibility or
            delete the list.
          </p>

          <div>
            <label htmlFor="collaborator-search" className="mono-meta mb-1.5 block uppercase text-muted-foreground">
              {`Invite by username · ${collaborators.length}/${MAX_LIST_COLLABORATORS}`}
            </label>
            <input
              id="collaborator-search"
              type="search"
              autoComplete="off"
              value={query}
              disabled={isFull}
              placeholder={isFull ? "This list is full" : "Search people"}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-md border border-border/75 bg-background/45 px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-50"
            />
            {deferredQuery && !isFull ? (
              <ul aria-label="People found" className="mt-2 max-h-48 overflow-y-auto">
                {results.length === 0 && !searchQuery.isPending ? (
                  <li className="body-s py-2 text-muted-foreground">No one to invite by that name.</li>
                ) : null}
                {results.map((person) => (
                  <li key={person.id} className="flex items-center gap-2.5 border-b border-border/40 py-2 last:border-0">
                    <FeedActorAvatar
                      avatarUrl={person.avatarUrl}
                      username={person.username}
                      initial={person.username.slice(0, 1).toUpperCase()}
                    />
                    <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">
                      {person.displayUsername ?? person.username}
                    </span>
                    <button
                      type="button"
                      disabled={inviteMutation.isPending}
                      onClick={() => inviteMutation.mutate(person.username, { onSuccess: () => setQuery("") })}
                      className={`${pill} border-primary/45 bg-primary/10 text-primary`}
                    >
                      {`Invite ${person.username}`}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <ul aria-label="Collaborators">
            {collaborators.length === 0 ? (
              <li className="body-s text-muted-foreground">No collaborators yet.</li>
            ) : null}
            {collaborators.map((person) => (
              <li key={person.userId} className="flex items-center gap-2.5 border-b border-border/40 py-2 last:border-0">
                <FeedActorAvatar
                  avatarUrl={person.avatarUrl}
                  username={person.username}
                  initial={person.username.slice(0, 1).toUpperCase()}
                />
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">
                  {person.displayUsername ?? person.username}
                </span>
                {person.status === "invited" ? (
                  <span className="mono-meta uppercase text-muted-foreground">Invited</span>
                ) : null}
                <button
                  type="button"
                  aria-label={`Remove ${person.username}`}
                  disabled={removeMutation.isPending}
                  onClick={() => removeMutation.mutate(person.userId)}
                  className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/[0.06] hover:text-[color:var(--danger)] disabled:opacity-50"
                >
                  <X aria-hidden className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </ModalShell>
  );
};
