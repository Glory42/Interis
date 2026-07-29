import { useRef, useState } from "react";
import { Download, Upload, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { ImportDialog } from "../components/ImportDialog";
import { useImportStream } from "../hooks/useImportStream";
import { exportDiary } from "../api";

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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Export */}
        <div className="border space-y-4 p-5 settings-shell-border settings-shell-panel">
          <div>
            <h2 className="text-base font-bold text-foreground">Export diary</h2>
            <p className="mt-1 text-sm settings-shell-muted">
              Download your full watch history as a CSV file. Includes dates,
              ratings, rewatches, and reviews.
            </p>
          </div>

          <button
            type="button"
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors settings-shell-border settings-shell-muted hover:text-foreground disabled:opacity-50"
          >
            {exportMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            {exportMutation.isPending ? "Exporting…" : "Export as CSV"}
          </button>

          {exportMutation.isError && (
            <p className="text-sm text-destructive">Export failed. Please try again.</p>
          )}
        </div>

        {/* Import */}
        <div className="border space-y-4 p-5 settings-shell-border settings-shell-panel">
          <div>
            <h2 className="text-base font-bold text-foreground">Import diary</h2>
            <p className="mt-1 text-sm settings-shell-muted">
              Import from a Letterboxd export —{" "}
              <span className="settings-shell-accent">diary.csv</span>,{" "}
              <span className="settings-shell-accent">reviews.csv</span>,{" "}
              <span className="settings-shell-accent">watched.csv</span>, or{" "}
              <span className="settings-shell-accent">watchlist.csv</span> — or
              a previous Interis export. Reviews and watchlist entries are
              imported automatically. Duplicates are skipped.
            </p>
          </div>

          {/* Running in background banner */}
          {isImportRunning && !dialogOpen && (
            <div className="flex items-center justify-between border px-3 py-2 settings-shell-border settings-shell-active-pill">
              <div className="flex items-center gap-2 text-sm settings-shell-accent">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>
                  Import running — {importState.processed} / {importState.total} processed
                </span>
              </div>
              <button
                type="button"
                onClick={handleReopen}
                className="text-xs font-medium settings-shell-accent underline-offset-2 hover:underline"
              >
                View
              </button>
            </div>
          )}

          {/* Done in background banner */}
          {isImportDone && !dialogOpen && (
            <div className="flex items-center justify-between rounded-lg border px-3 py-2 settings-shell-border">
              <span className="text-sm settings-shell-muted">
                Last import: {importState.summary.imported} imported ·{" "}
                {importState.summary.skipped} skipped ·{" "}
                {importState.summary.failed} failed
              </span>
              <button
                type="button"
                onClick={handleReopen}
                className="text-xs font-medium settings-shell-muted hover:text-foreground"
              >
                View log
              </button>
            </div>
          )}

          <div className="space-y-3">
            <div
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-8 transition-colors settings-shell-border hover:border-[color:var(--settings-shell-accent)]"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              <Upload className="h-5 w-5 settings-shell-muted" />
              <p className="text-sm settings-shell-muted">
                {selectedFile ? selectedFile.name : "Click to select a CSV file"}
              </p>
              {selectedFile && (
                <p className="text-xs settings-shell-muted">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              type="button"
              onClick={handleImport}
              disabled={!selectedFile || isImportRunning}
              className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: "var(--settings-shell-accent)", color: "var(--primary-foreground)" }}
            >
              <Upload className="h-3.5 w-3.5" />
              Import
            </button>
          </div>
        </div>
      </div>

      <ImportDialog
        isOpen={dialogOpen}
        state={importState}
        onBackground={handleBackground}
        onClose={handleClose}
      />
    </>
  );
};
