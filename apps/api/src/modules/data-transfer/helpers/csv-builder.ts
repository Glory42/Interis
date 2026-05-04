function escapeCsvField(value: string): string {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildCsv(headers: string[], rows: Record<string, string>[]): string {
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((h) => escapeCsvField(row[h] ?? "")).join(","),
    ),
  ];
  return `${lines.join("\n")}\n`;
}
