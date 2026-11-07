import { LineRowsSkeleton, LoadingRegion } from "@/components/ui/PageSkeletons";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

type AdminPanelStateProps<T> = {
  query: {
    isPending: boolean;
    isError: boolean;
    data: T[] | undefined;
    hasNextPage?: boolean;
    isFetchingNextPage?: boolean;
    fetchNextPage?: () => unknown;
  };
  emptyMessage: string;
  errorMessage?: string;
  children: (data: T[]) => ReactNode;
};

export const AdminPanelState = <T,>({
  query,
  emptyMessage,
  errorMessage = "Could not load this data.",
  children,
}: AdminPanelStateProps<T>) => {
  if (query.isPending) {
    return (
      <LoadingRegion label="Loading">
        <LineRowsSkeleton count={6} />
      </LoadingRegion>
    );
  }

  if (query.isError) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{errorMessage}</p>;
  }

  if (!query.data || query.data.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <>
      {children(query.data)}
      {query.hasNextPage && query.fetchNextPage ? (
        <div className="flex justify-center pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={query.isFetchingNextPage}
            onClick={() => void query.fetchNextPage?.()}
          >
            {query.isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}
    </>
  );
};
