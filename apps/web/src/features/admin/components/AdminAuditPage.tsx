import { LineRowsSkeleton, LoadingRegion } from "@/components/ui/PageSkeletons";
import { useState, type FormEvent } from "react";
import { useAuditLog } from "@/features/admin/hooks/useAdminAuditComments";

const stamp = (date: Date) => date.toISOString().slice(5, 16).replace("T", " ");

// Read-only: every admin action with who, what, which target and why.
export const AdminAuditPage = () => {
  const [draft, setDraft] = useState("");
  const [actor, setActor] = useState("");
  const query = useAuditLog(actor);

  const applyFilter = (event: FormEvent) => {
    event.preventDefault();
    setActor(draft.trim());
  };

  return (
    <div>
      <form onSubmit={applyFilter} className="body-s mb-4 text-muted-foreground">
        {"Showing every action by "}
        <label htmlFor="audit-actor" className="sr-only">Admin</label>
        <input
          id="audit-actor"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="any admin"
          className="w-28 border-b border-dashed border-[color:var(--primary)] bg-transparent px-0.5 text-foreground outline-none"
        />
        {", newest first."}
      </form>

      {query.isPending ? (
        <LoadingRegion label="Loading audit log">
          <LineRowsSkeleton count={8} />
        </LoadingRegion>
      ) : query.isError ? (
        <p className="body-s text-[color:var(--danger)]">Could not load the audit log.</p>
      ) : query.data.length === 0 ? (
        <p className="body-s text-muted-foreground">No admin actions yet.</p>
      ) : (
        <ul className="border-t border-[color:var(--line)]">
          {query.data.map((entry) => (
            <li key={entry.id} className="grid grid-cols-[6.5rem_1fr] gap-x-3 border-b border-[color:var(--line)] py-2 sm:grid-cols-[6.5rem_7rem_11rem_1fr_1fr]">
              <span className="font-mono text-xs text-muted-foreground">{stamp(entry.createdAt)}</span>
              <span className="body-s text-foreground">{entry.actorUsername}</span>
              <span className="font-mono text-xs text-foreground">{entry.action}</span>
              <span className="body-s truncate text-muted-foreground">{entry.targetLabel ?? `${entry.targetType} ${entry.targetId.slice(0, 8)}`}</span>
              <span className="body-s text-muted-foreground">{entry.reason ?? "—"}</span>
            </li>
          ))}
        </ul>
      )}

      {query.hasNextPage ? (
        <button
          type="button"
          disabled={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
          className="body-s mt-3 text-primary hover:underline disabled:opacity-50"
        >
          Older →
        </button>
      ) : null}
    </div>
  );
};
