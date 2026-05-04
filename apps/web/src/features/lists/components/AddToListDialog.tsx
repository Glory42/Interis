import { useEffect, useState } from "react";
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

      {isOpen ? (
        <div className="theme-modal-overlay fixed inset-0 z-140 bg-background/70 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative mx-auto flex h-full w-full max-w-sm items-start px-4 pt-16 sm:pt-20">
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
                      const inList = Boolean(list.containsItem);
                      const isPendingThis =
                        toggleMutation.isPending &&
                        toggleMutation.variables?.listId === list.id;

                      return (
                        <li key={list.id}>
                          <button
                            type="button"
                            disabled={toggleMutation.isPending}
                            onClick={() => {
                              toggleMutation.mutate({
                                listId: list.id,
                                entryId: list.entryId,
                              });
                            }}
                            className="flex w-full items-center gap-3 border-b border-border/40 px-4 py-3 text-left transition-colors last:border-0 hover:bg-muted/10 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <div
                              className="flex h-4 w-4 shrink-0 items-center justify-center border"
                              style={{
                                borderColor: inList
                                  ? "var(--primary)"
                                  : "color-mix(in srgb, var(--border) 80%, transparent)",
                                background: inList
                                  ? "color-mix(in srgb, var(--primary) 15%, transparent)"
                                  : "transparent",
                              }}
                            >
                              {isPendingThis ? (
                                <Spinner className="h-2.5 w-2.5" />
                              ) : inList ? (
                                <Check
                                  className="h-2.5 w-2.5"
                                  style={{ color: "var(--primary)" }}
                                />
                              ) : null}
                            </div>
                            <span className="min-w-0 flex-1 truncate font-mono text-sm text-foreground">
                              {list.title}
                            </span>
                            <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                              {list.itemCount}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="border-t border-border/70 px-4 py-3">
                {isCreating ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value.slice(0, 100))}
                      placeholder="List name..."
                      autoFocus
                      className="flex-1 border border-border/75 bg-background/45 px-2.5 py-1.5 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          void handleCreateAndAdd();
                        }
                        if (e.key === "Escape") {
                          setIsCreating(false);
                          setNewTitle("");
                        }
                      }}
                    />
                    <button
                      type="button"
                      disabled={
                        !newTitle.trim() ||
                        createMutation.isPending ||
                        toggleMutation.isPending
                      }
                      onClick={() => { void handleCreateAndAdd(); }}
                      className="border border-primary/45 bg-primary/10 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-primary disabled:opacity-50"
                    >
                      {createMutation.isPending ? (
                        <Spinner className="h-3 w-3" />
                      ) : (
                        "Create"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreating(false);
                        setNewTitle("");
                      }}
                      className="border border-border/70 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground"
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
          </div>
        </div>
      ) : null}
    </>
  );
};
