import type { ReactNode } from "react";
import { Spinner } from "@/components/ui/spinner";

type AdminPanelStateProps<T> = {
  query: { isPending: boolean; isError: boolean; data: T[] | undefined };
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
      <div className="flex items-center justify-center py-10">
        <Spinner />
      </div>
    );
  }

  if (query.isError) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{errorMessage}</p>;
  }

  if (!query.data || query.data.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return <>{children(query.data)}</>;
};
