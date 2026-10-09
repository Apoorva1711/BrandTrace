/**
 * Prevent CSV formula injection (CSV Injection / Formula Injection CWE-1236).
 * Prepends a single quote if the field begins with =, +, -, @, tab, or carriage return.
 */
export function sanitizeCsvField(field) {
  if (field === null || field === undefined) {
    return '""';
  }
  let str = String(field);
  // If field starts with formula trigger characters, prepend single quote
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  // Escape internal double quotes by doubling them
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

export function generateCsv(headers, rows) {
  const headerLine = headers.map(h => sanitizeCsvField(h.label || h)).join(',');
  const rowLines = rows.map(row => {
    return headers.map(h => {
      const key = h.key || h;
      return sanitizeCsvField(row[key]);
    }).join(',');
  });
  return [headerLine, ...rowLines].join('\r\n');
}
