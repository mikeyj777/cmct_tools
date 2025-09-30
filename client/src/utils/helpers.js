export const sum = (arr) => arr.reduce((a, b) => a + b, 0);

// CSV parser that handles quoted fields (reasonable coverage)
export const parseCSV = (text) => {
  const rows = [];
  let cur = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++){
    const ch = text[i];
    const next = text[i+1];
    if (inQuotes) {
      if (ch === '"' && next === '"') { field += '"'; i++; continue; } // escaped quote
      if (ch === '"') { inQuotes = false; continue; }
      field += ch;
    } else {
      if (ch === '"') { inQuotes = true; continue; }
      if (ch === ',') { cur.push(field); field = ''; continue; }
      if (ch === '\r') continue;
      if (ch === '\n') { cur.push(field); rows.push(cur); cur = []; field = ''; continue; }
      field += ch;
    }
  }
  if (field !== '' || cur.length > 0) cur.push(field);
  if (cur.length > 0) rows.push(cur);
  return rows;
};

// Return map header value -> index (trimmed)
export const headerIndexMap = (headerRow) => {
  const map = {};
  for (let i = 0; i < headerRow.length; i++){
    map[ headerRow[i].trim() ] = i;
  }
  return map;
};

// Safely convert to number
export const toNum = (v) => {
  if (v === null || v === undefined) return NaN;
  const s = (''+v).trim();
  if (s === '') return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
};

// Format number for display (up to 4 decimal digits)
export const formatNumber = (n) => {
  if (!Number.isFinite(n)) return '';
  if (Math.abs(n) >= 100) return Math.round(n).toString();
  return (Math.round(n * 10000) / 10000).toString();
};

// Simple HTML text escaping (for rendering content where needed)
export const escapeHtml = (s) => {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

// Temperature conversions
export const celsiusToKelvin = (c) => {
  if (!Number.isFinite(c)) return NaN;
  return c + 273.15;
};
export const kelvinToCelsius = (k) => {
  if (!Number.isFinite(k)) return NaN;
  return k - 273.15;
};

// Compute normalized distances across any provided numeric keys:
// records: array of objects with numeric properties
// query: object with numeric values for some keys
// keys: array of key names to consider
// returns records with added distance property (based on provided keys only)
export const computeNormalizedDistances = (records, query, keys) => {
  // compute min/max per key over records
  const ranges = {};
  keys.forEach(k => {
    let min = Infinity, max = -Infinity;
    records.forEach(r => {
      const v = r[k];
      if (Number.isFinite(v)) {
        if (v < min) min = v;
        if (v > max) max = v;
      }
    });
    // Avoid zero-range
    const range = (max - min) || Math.max(1, Math.abs(min) || 1);
    ranges[k] = { min, max, range };
  });

  // For each record compute normalized squared sum over only keys present in query (finite)
  records.forEach(rec => {
    let sumSq = 0;
    let count = 0;
    keys.forEach(k => {
      const qv = query[k];
      const rv = rec[k];
      if (Number.isFinite(qv) && Number.isFinite(rv)) {
        const r = ranges[k].range;
        const d = (rv - qv) / r;
        sumSq += d * d;
        count++;
      }
    });
    // If no keys were provided/usable, set distance to Infinity
    rec.distance = (count > 0) ? Math.sqrt(sumSq / Math.max(1, count)) : Infinity;
  });

  return records;
};
