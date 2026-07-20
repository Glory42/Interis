import { useDeferredValue, useState } from "react";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  DeleteSerialAction,
  EditSerialAction,
  RefreshSerialAction,
} from "@/features/admin/components/AdminSerialRowActions";
import { useAdminSerials } from "@/features/admin/hooks/useAdminMedia";

export const AdminSerialsPanel = () => {
  const [queryInput, setQueryInput] = useState("");
  const deferredQuery = useDeferredValue(queryInput.trim());
  const serialsQuery = useAdminSerials(deferredQuery.length > 0 ? deferredQuery : undefined);

  return (
    <div className="space-y-4">
      <Input
        value={queryInput}
        onChange={(event) => setQueryInput(event.target.value)}
        placeholder="Search by title..."
        className="max-w-sm"
      />

      {serialsQuery.isPending ? (
        <div className="flex items-center justify-center py-10">
          <Spinner />
        </div>
      ) : serialsQuery.isError ? (
        <p className="text-sm text-muted-foreground">Could not load series.</p>
      ) : serialsQuery.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No cached series found.</p>
      ) : (
        <div className="border border-border/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">First air year</th>
                <th className="px-3 py-2">Creator</th>
                <th className="px-3 py-2">TMDB ID</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {serialsQuery.data.map((serial) => (
                <tr key={serial.id} className="border-b border-border/40 last:border-0">
                  <td className="px-3 py-2 text-foreground">{serial.title}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {serial.firstAirYear ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{serial.creator ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{serial.tmdbId}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <EditSerialAction serial={serial} />
                      <RefreshSerialAction serial={serial} />
                      <DeleteSerialAction serial={serial} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
