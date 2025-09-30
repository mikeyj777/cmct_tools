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

// Format number for display (up to 4 significant decimal digits, round for large numbers)
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

// Find header name by pattern parts (lower-cased contains)
export const findColumnByPattern = (headers, parts) => {
    for (const h of headers) {
        const kk = h.toLowerCase();
        if (parts.every(x => kk.includes(x))) return h;
    }
    return null;
};
