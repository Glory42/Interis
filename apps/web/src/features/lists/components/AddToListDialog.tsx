import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import FocusLock from "react-focus-lock";
import { Check, List, Plus, X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  useCreateList,
  useToggleListItem,
  useUserListsForItem,
} from "@/features/lists/hooks/useLists";

type AddToListDialogProps = {
  tmdbId: number;
  itemType: "cinema" | "serial";
  triggerStyle?: React.CSSProperties;
  triggerClassName?: string;
};

export const AddToListDialog = ({
  tmdbId,
  itemType,
  triggerStyle,
  triggerClassName,
}: AddToListDialogProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const username = user?.username ?? "";

  const listsQuery = useUserListsForItem(username, tmdbId, itemType, isOpen && Boolean(user));
  const toggleMutation = useToggleListItem(username, tmdbId, itemType);
  const createMutation = useCreateList(username);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const handleCreateAndAdd = async () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;

    const created = await createMutation.mutateAsync({
      title: trimmed,
      isPublic: true,
    });

    await toggleMutation.mutateAsync({ listId: created.id, entryId: null });
    setIsCreating(false);
    setNewTitle("");
  };

  if (!user) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={triggerClassName}
        style={triggerStyle}
      >
        <List className="h-3 w-3" />
        <span>Lists</span>
      </button>

      {isOpen
        ? createPortal(
            <div className="theme-modal-overlay fixed inset-0 z-140 bg-background/70 backdrop-blur-sm">
              <button
                type="button"
                aria-label="Close dialog"
                className="absolute inset-0"
                onClick={() => setIsOpen(false)}
              />
              <div className="relative mx-auto flex h-full w-full max-w-sm items-center justify-center p-4">
                <FocusLock returnFocus className="contents">
                <section className="theme-modal-panel relative w-full overflow-hidden border border-border/80 bg-card/95 p-0 animate-fade-up">
                  <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      Add to list
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="inline-flex h-7 w-7 items-center justify-center border border-border/70 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="max-h-[360px] overflow-y-auto">
                    {listsQuery.isPending ? (
                      <div className="flex items-center justify-center py-8">
                        <Spinner />
                      </div>
                    ) : listsQuery.isError ? (
                      <p className="py-8 text-center font-mono text-xs text-muted-foreground">
                        Could not load lists.
                      </p>
                    ) : listsQuery.data?.length === 0 ? (
                      <p className="py-6 text-center font-mono text-xs text-muted-foreground">
                        No lists yet. Create one below.
                      </p>
                    ) : (
                      <ul>
                        {listsQuery.data?.map((list) => {
                          const hasItem = Boolean(list.containsItem);
                          const isPending = toggleMutation.isPending;

                          return (
                            <li
                              key={list.id}
                              className="flex items-center justify-between border-b border-border/45 px-4 py-2.5 last:border-b-0"
                            >
                              <span className="font-mono text-xs text-foreground">
                                {list.title}
                              </span>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() =>
                                  void toggleMutation.mutateAsync({
                                    listId: list.id,
                                    entryId: list.entryId,
                                  })
                                }
                                className="inline-flex h-7 w-7 items-center justify-center border border-border/70 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                              >
                                {hasItem ? (
                                  <Check className="h-4 w-4 text-primary" />
                                ) : (
                                  <Plus className="h-4 w-4" />
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  <div className="border-t border-border/70 px-4 py-3">
                    {isCreating ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value.slice(0, 100))}
                          placeholder="List title..."
                          className="flex-1 border border-border/75 bg-background/45 px-2 py-1 font-mono text-[10px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/45"
                          autoFocus
                        />
                        <button
                          type="button"
                          disabled={createMutation.isPending || !newTitle.trim()}
                          onClick={() => void handleCreateAndAdd()}
                          className="border border-primary/45 bg-primary/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-primary disabled:opacity-50"
                        >
                          Create
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreating(false);
                            setNewTitle("");
                          }}
                          className="border border-border/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        New list
                      </button>
                    )}
                  </div>
                </section>
                </FocusLock>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
};
