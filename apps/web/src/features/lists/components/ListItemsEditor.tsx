import { useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import type { ListItem } from "@/features/lists/api";
import type { SearchResult } from "@/features/lists/components/ListItemSearch";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
const getPosterUrl = (path: string | null) =>
  path ? `${TMDB_IMAGE_BASE}/w92${path}` : "";

type ListItemsEditorProps = {
  mode: "create" | "edit";
  items: Array<ListItem | SearchResult>;
  showRanked: boolean;
  onReorder: (from: number, to: number) => void | Promise<void>;
  onRemove: (identifier: string | number) => void;
  // Any removal in flight disables every item's remove button (prevents
  // concurrent removes); removingItemId identifies which one to spin.
  isAnyRemovePending: boolean;
  removingItemId: string | number | null;
  isReorderPending: boolean;
};

export const ListItemsEditor = ({
  mode,
  items,
  showRanked,
  onReorder,
  onRemove,
  isAnyRemovePending,
  removingItemId,
  isReorderPending,
}: ListItemsEditorProps) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleMoveItem = async (fromIndex: number, direction: -1 | 1) => {
    await onReorder(fromIndex, fromIndex + direction);
  };

  const handleDragStart = (idx: number) => {
    setDragIndex(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIndex(idx);
  };

  const handleDrop = async (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== toIndex) {
      await onReorder(dragIndex, toIndex);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  if (items.length === 0) {
    return (
      <div className="border border-dashed border-border/50 py-12 text-center">
        <p className="font-mono text-sm text-muted-foreground">
          Search above to add films and series to this list.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-0">
      {items.map((item, idx) => {
        const posterPath = "posterPath" in item ? item.posterPath : null;
        const itemTitle = "title" in item ? item.title : null;
        const releaseYear = "releaseYear" in item ? item.releaseYear : null;
        const itemId = "id" in item ? item.id : idx;

        const isThisItemRemoving =
          mode === "edit" && isAnyRemovePending && removingItemId === itemId;
        const isDragging = dragIndex === idx;
        const isDragOver = dragOverIndex === idx && dragIndex !== idx;

        return (
          <li
            key={mode === "edit" ? (itemId as string) : idx}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={(e) => { void handleDrop(e, idx); }}
            onDragEnd={handleDragEnd}
            className="flex items-center gap-4 border-b border-border/40 py-4 last:border-0 transition-opacity"
            style={{
              opacity: isDragging ? 0.4 : 1,
              borderTop: isDragOver ? "2px solid var(--primary)" : undefined,
              cursor: "grab",
            }}
          >
            {/* Drag handle */}
            <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground/30" />

            {/* Rank number */}
            {showRanked ? (
              <span className="w-6 shrink-0 text-right font-mono text-base font-bold text-muted-foreground/50">
                {idx + 1}
              </span>
            ) : null}

            {/* Poster */}
            <div className="h-[72px] w-12 shrink-0 overflow-hidden border border-border/40 bg-muted/20">
              {posterPath ? (
                <img
                  src={getPosterUrl(posterPath)}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                  draggable={false}
                />
              ) : null}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-base font-semibold text-foreground">
                {itemTitle ?? "Unknown"}
              </p>
              {releaseYear ? (
                <p className="font-mono text-sm text-muted-foreground">
                  {releaseYear}
                </p>
              ) : null}
            </div>

            {/* Controls */}
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                disabled={idx === 0 || isReorderPending}
                onClick={() => { void handleMoveItem(idx, -1); }}
                className="inline-flex h-7 w-7 items-center justify-center border border-border/50 text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={idx === items.length - 1 || isReorderPending}
                onClick={() => { void handleMoveItem(idx, 1); }}
                className="inline-flex h-7 w-7 items-center justify-center border border-border/50 text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={isAnyRemovePending}
                onClick={() => onRemove(mode === "edit" ? (itemId as string) : idx)}
                className="inline-flex h-7 w-7 items-center justify-center border border-border/50 text-muted-foreground/60 transition-colors hover:border-destructive/50 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-30"
              >
                {isThisItemRemoving ? (
                  <Spinner className="h-3 w-3" />
                ) : (
                  <X className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
};
