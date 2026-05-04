type CsvRow = Record<string, string>;

function parseRawRows(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          currentCell += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        currentCell += char;
        i++;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
      } else if (char === ",") {
        currentRow.push(currentCell);
        currentCell = "";
        i++;
      } else if (char === "\n") {
        currentRow.push(currentCell);
        rows.push(currentRow);
        currentRow = [];
        currentCell = "";
        i++;
      } else {
        currentCell += char;
        i++;
      }
    }
  }

  if (currentCell !== "" || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows;
}

export function parseCsv(text: string): CsvRow[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trimEnd();
  const rows = parseRawRows(normalized);

  if (rows.length < 2) return [];

  const headers = rows[0];
  if (!headers) return [];

  const result: CsvRow[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || (row.length === 1 && row[0] === "")) continue;

    const obj: CsvRow = {};
    for (let j = 0; j < headers.length; j++) {
      const key = headers[j];
      if (key !== undefined) {
        obj[key] = row[j] ?? "";
      }
    }
    result.push(obj);
  }

  return result;
}

export function getCsvHeaders(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const firstLine = normalized.split("\n")[0] ?? "";
  return firstLine.split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
}
