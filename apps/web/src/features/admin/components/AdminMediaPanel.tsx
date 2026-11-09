import { useDeferredValue, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminMediaRowActions } from "@/features/admin/components/AdminMediaRowActions";
import { AdminPanelHeader } from "@/features/admin/components/AdminPanelHeader";
import { AdminPanelState } from "@/features/admin/components/AdminPanelState";
import { AdminSearchInput } from "@/features/admin/components/AdminSearchInput";
import { useAdminMediaList } from "@/features/admin/hooks/useAdminMedia";
import type { AdminMediaKind } from "@/features/admin/media-api";
import { ADMIN_MEDIA_KINDS } from "@/features/admin/media-kinds";

export const AdminMediaPanel = ({ kind }: { kind: AdminMediaKind }) => {
  const { pluralNoun, panelTitle, panelDescription, yearLabel, creditLabel } = ADMIN_MEDIA_KINDS[kind];
  const [queryInput, setQueryInput] = useState("");
  const deferredQuery = useDeferredValue(queryInput.trim());
  const mediaQuery = useAdminMediaList(kind, deferredQuery.length > 0 ? deferredQuery : undefined);

  return (
    <div className="space-y-4">
      <AdminPanelHeader
        title={panelTitle}
        description={panelDescription}
        action={
          <AdminSearchInput
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            placeholder="Search by title..."
          />
        }
      />

      <AdminPanelState
        query={mediaQuery}
        emptyMessage={`No cached ${pluralNoun} found.`}
        errorMessage={`Could not load ${pluralNoun}.`}
      >
        {(titles) => (
          <div className="surface">
            <Table>
              <TableHeader>
                <TableRow className="border-0 hover:bg-transparent">
                  <TableHead>Title</TableHead>
                  <TableHead>{yearLabel}</TableHead>
                  <TableHead>{creditLabel}</TableHead>
                  <TableHead>TMDB ID</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {titles.map((media) => (
                  <TableRow key={media.id}>
                    <TableCell className="text-foreground">{media.title}</TableCell>
                    <TableCell className="text-muted-foreground">{media.year ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{media.credit ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{media.tmdbId}</TableCell>
                    <TableCell>
                      <AdminMediaRowActions kind={kind} media={media} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </AdminPanelState>
    </div>
  );
};
