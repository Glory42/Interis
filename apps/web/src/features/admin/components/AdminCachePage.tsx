import { Skeleton } from "@/components/ui/Skeleton";
import { LoadingRegion } from "@/components/ui/PageSkeletons";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { CacheKind, RefreshResult } from "@/features/admin/cache-api";
import { useCacheSummary, usePurgeUnreferenced, useRefreshOldest } from "@/features/admin/hooks/useAdminCache";
import { isApiError } from "@/lib/api-client";

const n = (value: number) => value.toLocaleString("en-US");

const Credit = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex items-baseline gap-2 py-1">
    <span className="body-s text-foreground">{label}</span>
    <span aria-hidden className="min-w-3 flex-1 -translate-y-1 border-b border-dotted border-[color:var(--line-strong)]" />
    <span className="font-mono text-sm text-foreground">{children}</span>
  </div>
);

const describeRefresh = ({ titles }: RefreshResult) => {
  const failed = titles.filter((title) => !title.ok);
  const done = `${titles.length - failed.length} of ${titles.length} refreshed`;
  return failed.length > 0 ? `${done} · failed: ${failed.map((title) => title.title).join(", ")}` : done;
};

export const AdminCachePage = () => {
  const summary = useCacheSummary();
  const refresh = useRefreshOldest();
  const purge = usePurgeUnreferenced();
  const [isPurging, setIsPurging] = useState(false);

  if (summary.isPending) {
    return (
      <LoadingRegion label="Loading cache" className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="space-y-2 rounded-[3px] border border-[color:var(--line)] p-3">
            <Skeleton className="h-2.5 w-16 rounded-sm" />
            <Skeleton className="h-7 w-20 rounded-sm" />
          </div>
        ))}
      </LoadingRegion>
    );
  }
  if (summary.isError) return <p className="body-s text-[color:var(--danger)]">Could not load the cache summary.</p>;

  const { titles, unreferenced, memory, startedAt } = summary.data;
  const purgeable = unreferenced.movies + unreferenced.serials;
  const runRefresh = (kind: CacheKind) => refresh.mutate(kind);

  return (
    <div className="max-w-2xl">
      <div className="mono-meta mb-3 flex justify-between uppercase text-muted-foreground">
        <span>TMDB mirror</span>
        <button type="button" disabled={summary.isFetching} onClick={() => void summary.refetch()} className="hover:text-foreground disabled:opacity-50">
          ↻ Refresh
        </button>
      </div>
      <Credit label="Films cached">{n(titles.movies)}</Credit>
      <Credit label="Series cached">{n(titles.serials)}</Credit>
      <Credit label="Unreferenced">{`${n(unreferenced.movies)} films · ${n(unreferenced.serials)} series`}</Credit>
      <Credit label={`Since boot ${startedAt.toTimeString().slice(0, 5)}`}>{`${n(memory.hits)} hits · ${n(memory.misses)} misses`}</Credit>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={refresh.isPending} onClick={() => runRefresh("movie")}>
          Refresh oldest 25 films
        </Button>
        <Button size="sm" variant="outline" disabled={refresh.isPending} onClick={() => runRefresh("serial")}>
          Refresh oldest 25 series
        </Button>
        <Button size="sm" variant="danger" disabled={purgeable === 0} onClick={() => setIsPurging(true)}>
          {`Purge ${n(purgeable)}…`}
        </Button>
      </div>
      <p className="body-s mt-2 text-muted-foreground">Purge removes titles nothing references, 500 at a time, after your password.</p>

      {refresh.isPending ? <p className="body-s mt-3 text-muted-foreground">Refreshing…</p> : null}
      {refresh.data ? <p className="body-s mt-3 text-foreground">{describeRefresh(refresh.data)}</p> : null}
      {purge.data ? <p className="body-s mt-3 text-foreground">{`Purged ${n(purge.data.movies)} films and ${n(purge.data.serials)} series.`}</p> : null}

      <ConfirmDialog
        isOpen={isPurging}
        context="Cache · Purge"
        title={`Purge ${n(purgeable)} unreferenced titles?`}
        description="Titles no diary, review, list, post, top pick or activity points to. They come back from TMDB the next time someone opens them."
        confirmLabel="Purge"
        isDestructive
        requirePassword
        isConfirming={purge.isPending}
        error={purge.isError ? (isApiError(purge.error) ? purge.error.message : "Purge failed.") : null}
        onClose={() => {
          setIsPurging(false);
          purge.reset();
        }}
        onConfirm={(password) => purge.mutate(password ?? "", { onSuccess: () => setIsPurging(false) })}
      />
    </div>
  );
};
