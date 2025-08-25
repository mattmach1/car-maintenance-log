export type CsvValue = string | number | null | undefined;
export type CsvRow = Record<string, CsvValue>;

export function toCsv(rows: CsvRow[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);

  const escape = (val: CsvValue) => {
    if (val === null || val === undefined) return "";
    const s = String(val);
    // Quote if it contains comma, quote or newline
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const head = headers.join(",");
  const body = rows
    .map((r) => headers.map((h) => escape(r[h])).join(","))
    .join("\n");

  return head + "\n" + body;
}

export function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}