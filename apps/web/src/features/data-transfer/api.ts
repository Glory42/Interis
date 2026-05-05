const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export type ImportStreamEvent =
  | { type: "start"; total: number; format: string }
  | { type: "row"; title: string; year: number | null; status: "imported" | "skipped" | "failed"; reason?: string }
  | { type: "done"; total: number; imported: number; skipped: number; failed: number };

export async function exportDiary(): Promise<void> {
  const res = await fetch(`${API_BASE}/api/data/export`, { credentials: "include" });
  if (!res.ok) throw new Error("Export failed");

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `interis-diary-${date}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function* importDiaryStream(
  file: File,
): AsyncGenerator<ImportStreamEvent> {
  const text = await file.text();

  const url = `${API_BASE}/api/data/import?filename=${encodeURIComponent(file.name)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/csv" },
    credentials: "include",
    body: text,
  });

  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Import failed");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) yield JSON.parse(trimmed) as ImportStreamEvent;
      }
    }
    if (buffer.trim()) yield JSON.parse(buffer.trim()) as ImportStreamEvent;
  } finally {
    reader.releaseLock();
  }
}
