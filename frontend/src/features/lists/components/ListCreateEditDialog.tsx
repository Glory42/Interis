import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useCreateList, useUpdateList } from "@/features/lists/hooks/useLists";
import type { ListSummary } from "@/features/lists/api";

type CreateMode = {
  mode: "create";
  ownerUsername: string;
};

type EditMode = {
  mode: "edit";
  list: ListSummary;
  ownerUsername: string;
};

type ListCreateEditDialogProps = (CreateMode | EditMode) & {
  isOpen: boolean;
  onClose: () => void;
};

export const ListCreateEditDialog = (props: ListCreateEditDialogProps) => {
  const { isOpen, onClose } = props;

  const initialTitle = props.mode === "edit" ? props.list.title : "";
  const initialDesc =
    props.mode === "edit" ? (props.list.description ?? "") : "";
  const initialPublic = props.mode === "edit" ? props.list.isPublic : true;
  const initialRanked = props.mode === "edit" ? props.list.isRanked : false;

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDesc);
  const [isPublic, setIsPublic] = useState(initialPublic);
  const [isRanked, setIsRanked] = useState(initialRanked);

  useEffect(() => {
    if (!isOpen) return;
    setTitle(props.mode === "edit" ? props.list.title : "");
    setDescription(
      props.mode === "edit" ? (props.list.description ?? "") : "",
    );
    setIsPublic(props.mode === "edit" ? props.list.isPublic : true);
    setIsRanked(props.mode === "edit" ? props.list.isRanked : false);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const createMutation = useCreateList(props.ownerUsername);
  const editListId = props.mode === "edit" ? props.list.id : "";
  const updateMutation = useUpdateList(editListId, props.ownerUsername);

  const isPending = createMutation.isPending || updateMutation.isPending;
  const canSubmit = title.trim().length > 0 && !isPending;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    if (props.mode === "create") {
      await createMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        isPublic,
        isRanked,
      });
    } else {
      await updateMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        isPublic,
        isRanked,
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="theme-modal-overlay fixed inset-0 z-140 bg-background/70 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="relative mx-auto flex h-full w-full max-w-md items-start px-4 pt-16 sm:pt-20">
        <section className="theme-modal-panel relative w-full overflow-hidden border border-border/80 bg-card/95 p-0 animate-fade-up">
          <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {props.mode === "create" ? "New List" : "Edit List"}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-7 w-7 items-center justify-center border border-border/70 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 px-4 py-4">
            <div>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                placeholder="Give your list a name..."
                className="w-full border border-border/75 bg-background/45 px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Description{" "}
                <span className="normal-case tracking-normal opacity-60">
                  (optional)
                </span>
              </label>
              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value.slice(0, 500))
                }
                placeholder="What's this list about?"
                rows={3}
                className="w-full resize-none border border-border/75 bg-background/45 px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
              <p className="mt-1 font-mono text-[10px] text-muted-foreground/60">
                {description.length}/500
              </p>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Visibility
                </p>
                <div className="flex gap-2">
                  {(["Public", "Private"] as const).map((v) => {
                    const active = v === "Public" ? isPublic : !isPublic;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setIsPublic(v === "Public")}
                        className="flex-1 border px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors"
                        style={{
                          borderColor: active
                            ? "var(--primary)"
                            : "color-mix(in srgb, var(--border) 80%, transparent)",
                          color: active
                            ? "var(--primary)"
                            : "color-mix(in srgb, var(--foreground) 50%, transparent)",
                          background: active
                            ? "color-mix(in srgb, var(--primary) 8%, transparent)"
                            : "transparent",
                        }}
                      >
                        {v}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Ranking
                </p>
                <div className="flex gap-2">
                  {(["Ranked", "Unranked"] as const).map((v) => {
                    const active = v === "Ranked" ? isRanked : !isRanked;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setIsRanked(v === "Ranked")}
                        className="flex-1 border px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors"
                        style={{
                          borderColor: active
                            ? "var(--primary)"
                            : "color-mix(in srgb, var(--border) 80%, transparent)",
                          color: active
                            ? "var(--primary)"
                            : "color-mix(in srgb, var(--foreground) 50%, transparent)",
                          background: active
                            ? "color-mix(in srgb, var(--primary) 8%, transparent)"
                            : "transparent",
                        }}
                      >
                        {v}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="border border-border/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { void handleSubmit(); }}
                disabled={!canSubmit}
                className="border border-primary/45 bg-primary/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Spinner className="h-3 w-3" /> Saving
                  </span>
                ) : props.mode === "create" ? (
                  "Create"
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
