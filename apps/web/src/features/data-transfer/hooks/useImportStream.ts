import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { importDiaryStream } from "../api";
import type { ImportStreamEvent } from "../api";
import { diaryKeys } from "@/features/diary/hooks/useDiary";

export type TerminalLine = {
  id: number;
  title: string;
  year: number | null;
  status: "imported" | "skipped" | "failed";
  reason?: string;
};

export type ImportSummary = {
  total: number;
  imported: number;
  skipped: number;
  failed: number;
};

export type ImportStreamState =
  | { phase: "idle" }
  | { phase: "running"; format: string; total: number; processed: number; lines: TerminalLine[] }
  | { phase: "done"; format: string; total: number; lines: TerminalLine[]; summary: ImportSummary }
  | { phase: "error"; message: string };

export function useImportStream() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<ImportStreamState>({ phase: "idle" });
  const lineId = useRef(0);

  const startImport = useCallback(async (file: File) => {
    setState({ phase: "running", format: "", total: 0, processed: 0, lines: [] });

    let capturedFormat = file.name;
    let capturedTotal = 0;
    const collectedLines: TerminalLine[] = [];

    try {
      for await (const event of importDiaryStream(file)) {
        handleEvent(event);
      }
    } catch (err) {
      setState({
        phase: "error",
        message: err instanceof Error ? err.message : "Import failed.",
      });
      return;
    }

    function handleEvent(event: ImportStreamEvent) {
      if (event.type === "start") {
        capturedFormat = event.format;
        capturedTotal = event.total;
        setState({
          phase: "running",
          format: event.format,
          total: event.total,
          processed: 0,
          lines: [],
        });
        return;
      }

      if (event.type === "row") {
        const line: TerminalLine = {
          id: lineId.current++,
          title: event.title,
          year: event.year,
          status: event.status,
          reason: event.reason,
        };
        collectedLines.push(line);
        setState((prev) =>
          prev.phase === "running"
            ? { ...prev, processed: prev.processed + 1, lines: [...collectedLines] }
            : prev,
        );
        return;
      }

      if (event.type === "done") {
        queryClient.invalidateQueries({ queryKey: diaryKeys.all });
        setState({
          phase: "done",
          format: capturedFormat,
          total: capturedTotal,
          lines: [...collectedLines],
          summary: {
            total: event.total,
            imported: event.imported,
            skipped: event.skipped,
            failed: event.failed,
          },
        });
      }
    }
  }, [queryClient]);

  const reset = useCallback(() => {
    setState({ phase: "idle" });
  }, []);

  return { state, startImport, reset };
}
