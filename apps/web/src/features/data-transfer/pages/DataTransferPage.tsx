import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { ImportDialog } from "../components/ImportDialog";
import { useImportStream } from "../hooks/useImportStream";
import { exportDiary } from "../api";
import { TickLoader } from "@/components/ui/tick-loader";
import { Button } from "@/components/ui/button";

export const DataTransferPage = () => {
  const exportMutation = useMutation({ mutationFn: exportDiary });
  const { state: importState, startImport, reset } = useImportStream();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const isImportRunning = importState.phase === "running";
  const isImportDone = importState.phase === "done";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files?.[0] ?? null);
  };

  const handleImport = () => {
    if (!selectedFile || isImportRunning) return;
    reset();
    setDialogOpen(true);
    void startImport(selectedFile);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleBackground = () => setDialogOpen(false);

  const handleClose = () => {
    setDialogOpen(false);
    if (isImportDone) reset();
  };

  const handleReopen = () => setDialogOpen(true);

  return (
    <>
      <section>
        <h2 className="display-4 text-foreground">Your data</h2>
        <div className="mt-3 border-t border-[color:var(--line)]">
          <div className="border-b border-[color:var(--line)] py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="body text-foreground">Diary export</span>
              <Button variant="outline" size="md" onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>
                {exportMutation.isPending ? <TickLoader /> : <Download aria-hidden className="size-3.5" />}
                {exportMutation.isPending ? "Exporting…" : "Download CSV"}
              </Button>
            </div>
            <p className="mono-meta mt-1 uppercase text-muted-foreground">
              Date · Type · Title · Year · TMDB · Rating · Rewatch · Review · Spoilers
            </p>
            {exportMutation.isError ? <p className="body-s mt-1 text-[color:var(--danger)]">Export failed. Please try again.</p> : null}
          </div>

          <div className="border-b border-[color:var(--line)] py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="body text-foreground">Import</span>
              <div className="flex items-center gap-2">
                {selectedFile ? (
                  <span className="body-s max-w-48 truncate text-muted-foreground">{`${selectedFile.name} · ${(selectedFile.size / 1024).toFixed(1)} KB`}</span>
                ) : null}
                <Button variant="outline" size="md" onClick={() => fileInputRef.current?.click()} disabled={isImportRunning}>
                  <Upload aria-hidden className="size-3.5" />
                  Choose CSV…
                </Button>
                {selectedFile ? (
                  <Button size="md" onClick={handleImport} disabled={isImportRunning}>
                    Import
                  </Button>
                ) : null}
              </div>
            </div>
            <p className="mono-meta mt-1 uppercase text-muted-foreground">
              Letterboxd diary / reviews / watched / watchlist · Interis CSV · duplicates skipped
            </p>
            <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />

            {isImportRunning && !dialogOpen ? (
              <p className="body-s mt-2 flex items-center gap-2 text-muted-foreground">
                <TickLoader />
                {`Import running — ${importState.processed} / ${importState.total} processed`}
                <button type="button" onClick={handleReopen} className="text-primary hover:underline">
                  View
                </button>
              </p>
            ) : null}
            {isImportDone && !dialogOpen ? (
              <p className="body-s mt-2 text-muted-foreground">
                {`Last import: ${importState.summary.imported} imported · ${importState.summary.skipped} skipped · ${importState.summary.failed} failed `}
                <button type="button" onClick={handleReopen} className="text-primary hover:underline">
                  View log
                </button>
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <ImportDialog
        isOpen={dialogOpen}
        state={importState}
        onBackground={handleBackground}
        onClose={handleClose}
      />
    </>
  );
};
