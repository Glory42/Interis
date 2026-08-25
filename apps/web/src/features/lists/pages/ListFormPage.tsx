import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { addListItem, type ListDetail } from "@/features/lists/api";
import {
  useAddListItem,
  useCreateList,
  useListDetail,
  useRemoveListItem,
  useReorderListItems,
  useUpdateList,
} from "@/features/lists/hooks/useLists";
import { ListMetadataFields } from "@/features/lists/components/ListMetadataFields";
import { ListItemSearch, type SearchResult } from "@/features/lists/components/ListItemSearch";
import { ListItemsEditor } from "@/features/lists/components/ListItemsEditor";

type PendingItem = SearchResult;

type CreateProps = { mode: "create"; username: string };
type EditProps = { mode: "edit"; username: string; listId: string };
type ListFormPageProps = CreateProps | EditProps;

export const ListFormPage = (props: ListFormPageProps) => {
  const { mode, username } = props;
  const listId = mode === "edit" ? props.listId : "";

  const detailQuery = useListDetail(listId, mode === "edit");
  const list = mode === "edit" ? (detailQuery.data ?? null) : null;

  if (mode === "edit" && detailQuery.isPending) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
        <Spinner /> Loading list...
      </div>
    );
  }

  if (mode === "edit" && (detailQuery.isError || !list)) {
    return (
      <div className="rounded-xl border border-border/60 bg-card/30 p-4 text-sm text-destructive">
        This list could not be loaded.
      </div>
    );
  }

  return (
    <ListFormPageContent
      // Keying by the list id (or "create") remounts the form fresh each
      // time it loads a different list, so field state naturally
      // initializes from `list` without an effect syncing it in.
      key={mode === "edit" ? (list?.id ?? "loading") : "create"}
      mode={mode}
      username={username}
      listId={listId}
      list={list}
    />
  );
};

type ListFormPageContentProps = {
  mode: "create" | "edit";
  username: string;
  listId: string;
  list: ListDetail | null;
};

const ListFormPageContent = ({
  mode,
  username,
  listId,
  list,
}: ListFormPageContentProps) => {
  const navigate = useNavigate();

  const [title, setTitle] = useState(() => list?.title ?? "");
  const [description, setDescription] = useState(() => list?.description ?? "");
  const [isPublic, setIsPublic] = useState(() => list?.isPublic ?? true);
  const [isRanked, setIsRanked] = useState(() => list?.isRanked ?? false);

  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);

  const existingTmdbIds = new Set(
    mode === "edit"
      ? (list?.items ?? []).map((i) => `${i.itemType}:${i.tmdbId}`)
      : pendingItems.map((i) => `${i.itemType}:${i.tmdbId}`),
  );

  const createMutation = useCreateList(username);
  const updateMutation = useUpdateList(listId, username);
  const addItemMutation = useAddListItem(listId, username);
  const removeItemMutation = useRemoveListItem(listId, username);
  const reorderMutation = useReorderListItems(listId);

  const [isSaving, setIsSaving] = useState(false);

  const handleAddItem = async (result: SearchResult) => {
    const key = `${result.itemType}:${result.tmdbId}`;
    if (existingTmdbIds.has(key)) return;

    if (mode === "create") {
      setPendingItems((prev) => [...prev, result]);
    } else {
      await addItemMutation.mutateAsync({
        tmdbId: result.tmdbId,
        itemType: result.itemType,
        title: result.title,
        posterPath: result.posterPath,
        releaseYear: result.releaseYear,
      });
    }
  };

  const handleRemoveItem = (identifier: string | number) => {
    if (mode === "create") {
      setPendingItems((prev) => prev.filter((_, i) => i !== identifier));
    } else {
      removeItemMutation.mutate(identifier as string);
    }
  };

  const reorderByIndices = async (from: number, to: number) => {
    if (from === to) return;
    if (mode === "create") {
      setPendingItems((prev) => {
        const next = [...prev];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved!);
        return next;
      });
    } else {
      if (!list) return;
      const next = [...list.items];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved!);
      await reorderMutation.mutateAsync(
        next.map((item, idx) => ({ id: item.id, position: idx + 1 })),
      );
    }
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    setIsSaving(true);
    try {
      if (mode === "create") {
        const created = await createMutation.mutateAsync({
          title: trimmedTitle,
          description: description.trim() || undefined,
          isPublic,
          isRanked,
        });
        for (const item of pendingItems) {
          await addListItem(created.id, { tmdbId: item.tmdbId, itemType: item.itemType });
        }
        void navigate({
          to: "/profile/$username/lists/$listId",
          params: { username, listId: created.id },
        });
      } else {
        await updateMutation.mutateAsync({
          title: trimmedTitle,
          description: description.trim() || null,
          isPublic,
          isRanked,
        });
        void navigate({
          to: "/profile/$username/lists/$listId",
          params: { username, listId },
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = title.trim().length > 0 && !isSaving;

  const currentItems = mode === "edit" ? (list?.items ?? []) : pendingItems;
  const showRanked = mode === "edit" ? (list?.isRanked ?? isRanked) : isRanked;

  return (
    <div>
      <Link
        to="/profile/$username/lists"
        params={{ username }}
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to lists
      </Link>

      <div className="mb-8 flex items-center justify-between gap-4 border-b border-border/50 pb-5">
        <h1 className="font-mono text-xl font-bold text-foreground">
          {mode === "create" ? "New List" : "Edit List"}
        </h1>
        <div className="flex items-center gap-2">
          <Link
            to="/profile/$username/lists"
            params={{ username }}
            className="rounded-full border border-border/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </Link>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => { void handleSave(); }}
            className="rounded-full border border-primary/45 bg-primary/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-primary transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (
              <span className="inline-flex items-center gap-1.5">
                <Spinner className="h-3 w-3" /> Saving
              </span>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>

      <ListMetadataFields
        title={title}
        onTitleChange={setTitle}
        description={description}
        onDescriptionChange={setDescription}
        isPublic={isPublic}
        onIsPublicChange={setIsPublic}
        isRanked={isRanked}
        onIsRankedChange={setIsRanked}
      />

      <ListItemSearch existingTmdbIds={existingTmdbIds} onSelect={(result) => { void handleAddItem(result); }} />

      <ListItemsEditor
        mode={mode}
        items={currentItems}
        showRanked={showRanked}
        onReorder={reorderByIndices}
        onRemove={handleRemoveItem}
        isAnyRemovePending={removeItemMutation.isPending}
        removingItemId={removeItemMutation.variables ?? null}
        isReorderPending={reorderMutation.isPending}
      />
    </div>
  );
};
