import { useDeferredValue, useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPanelHeader } from "@/features/admin/components/AdminPanelHeader";
import { AdminPanelState } from "@/features/admin/components/AdminPanelState";
import { AdminSearchInput } from "@/features/admin/components/AdminSearchInput";
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
      <AdminPanelHeader
        title="Serials"
        description="Manage locally cached TV series records."
        action={
          <AdminSearchInput
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            placeholder="Search by title..."
          />
        }
      />

      <AdminPanelState
        query={serialsQuery}
        emptyMessage="No cached series found."
        errorMessage="Could not load series."
      >
        {(serials) => (
          <Card>
            <Table>
              <TableHeader>
                <TableRow className="border-0 hover:bg-transparent">
                  <TableHead>Title</TableHead>
                  <TableHead>First air year</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>TMDB ID</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serials.map((serial) => (
                  <TableRow key={serial.id}>
                    <TableCell className="text-foreground">{serial.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {serial.firstAirYear ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{serial.creator ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{serial.tmdbId}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <EditSerialAction serial={serial} />
                        <RefreshSerialAction serial={serial} />
                        <DeleteSerialAction serial={serial} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </AdminPanelState>
    </div>
  );
};
