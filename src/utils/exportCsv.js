const escapeCell = (value) => {
  if (value === null || value === undefined) return '';
  const text = Array.isArray(value) ? value.join('; ') : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

function downloadCsv(filename, lines) {
  const csv = lines.map((line) => line.map(escapeCell).join(',')).join('\r\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function columnsFromRows(rows) {
  return Array.from(
    rows.reduce((keys, row) => {
      Object.keys(row || {}).forEach((key) => keys.add(key));
      return keys;
    }, new Set())
  );
}

function columnValue(column, row) {
  if (typeof column.value === 'function') {
    return column.value(row);
  }

  return row?.[column.key];
}

function sectionLines(section) {
  const rows = section.rows || [];
  const columns = section.columns?.length
    ? section.columns
    : columnsFromRows(rows).map((key) => ({ key, label: key }));
  const lines = [[section.title]];

  if (section.description) {
    lines.push([section.description]);
  }

  if (!columns.length) {
    lines.push([section.emptyText || 'No records found.']);
    return lines;
  }

  lines.push(columns.map((column) => column.label || column.key));

  if (!rows.length) {
    lines.push([section.emptyText || 'No records found.']);
    return lines;
  }

  rows.forEach((row) => {
    lines.push(columns.map((column) => columnValue(column, row)));
  });

  return lines;
}

export function exportCsv(filename, rows) {
  const safeRows = rows || [];
  const headers = columnsFromRows(safeRows);
  downloadCsv(filename, [headers, ...safeRows.map((row) => headers.map((header) => row[header]))]);
}

export function exportCsvReport(filename, report) {
  const lines = [];

  if (report.title) {
    lines.push([report.title]);
  }
  if (report.subtitle) {
    lines.push([report.subtitle]);
  }

  if (report.metadata?.length) {
    if (lines.length) lines.push([]);
    lines.push(['Report details']);
    report.metadata.forEach((item) => lines.push([item.label, item.value]));
  }

  if (report.summary?.length) {
    if (lines.length) lines.push([]);
    lines.push(['Summary']);
    lines.push(['Metric', 'Value']);
    report.summary.forEach((item) => lines.push([item.label, item.value]));
  }

  (report.sections || []).forEach((section) => {
    if (lines.length) lines.push([]);
    lines.push(...sectionLines(section));
  });

  downloadCsv(filename, lines.length ? lines : [['No report data']]);
}
