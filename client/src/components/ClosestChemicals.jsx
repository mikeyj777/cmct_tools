// components/ClosestChemicals.jsx
import React, { useState } from 'react';
import {
  parseCSV,
  headerIndexMap,
  toNum,
  formatNumber,
  escapeHtml,
  findColumnByPattern
} from '../utils/helpers';

// Component: ClosestChemicals
const ClosestChemicals = () => {
  const [nbpInput, setNbpInput] = useState('');
  const [mwtInput, setMwtInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]); // array of records
  const [error, setError] = useState('');

  const resetStatus = () => {
    setError('');
    setResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetStatus();

    const nbpVal = toNum(nbpInput);
    const mwtVal = toNum(mwtInput);
    if (!Number.isFinite(nbpVal) || !Number.isFinite(mwtVal)) {
      setError('Please enter valid numeric values for both NBP and molecular weight.');
      return;
    }

    setLoading(true);

    try {
      const resp = await fetch('data/cheminfo_with_nbp.csv');
      if (!resp.ok) {
        throw new Error(`Could not fetch CSV: ${resp.status} ${resp.statusText}`);
      }
      const text = await resp.text();
      const rows = parseCSV(text);
      if (!rows || rows.length < 2) throw new Error('CSV appears empty or malformed.');

      const header = rows[0].map(h => h.trim());
      const idx = headerIndexMap(header);

      // Try find NBP and MW columns by pattern, fallbacks as in original script
      const nbpColName = findColumnByPattern(header, ['nbp','deg','k'])
        || findColumnByPattern(header, ['nbp'])
        || findColumnByPattern(header, ['nbp','k']);

      let mwtColName = findColumnByPattern(header, ['mw'])
        || findColumnByPattern(header, ['molecular','weight'])
        || 'mw';

      const nameColName = findColumnByPattern(header, ['chem','name'])
        || findColumnByPattern(header, ['name'])
        || 'chem_name';
      const casColName = findColumnByPattern(header, ['cas']) || 'cas_no';
      const lelColName = 'lel';

      if (!nbpColName || !(nbpColName in idx)) {
        // try last column if it looks like nbp
        const last = header[header.length - 1];
        if (last && last.toLowerCase().includes('nbp')) {
          idx['nbp_guess'] = header.length - 1;
          console.warn('Using last column as nbp:', last);
        } else {
          throw new Error('NBP column not found in CSV header. Expected a column with "nbp" and "k" in the name (e.g. nbp_deg_k). Found header: ' + header.join(', '));
        }
      }

      if (!(mwtColName in idx)) {
        if ('mw' in idx) {
          // ok
        } else {
          let found = null;
          for (const k of header) {
            const kk = k.toLowerCase();
            if (kk === 'mw' || kk.includes('mw') || (kk.includes('molecular') && kk.includes('weight'))) { found = k; break; }
          }
          if (found) mwtColName = found;
          else throw new Error('Molecular weight column not found in CSV header. Expected "mw" or something like "molecular weight". Found header: ' + header.join(', '));
        }
      }

      const nbpIndex = (nbpColName in idx) ? idx[nbpColName] : idx['nbp_guess'];
      const mwtIndex = idx[mwtColName];
      const nameIndex = (nameColName in idx) ? idx[nameColName] : (header.indexOf('chem_name') !== -1 ? header.indexOf('chem_name') : 0);
      const casIndex = (casColName in idx) ? idx[casColName] : (header.indexOf('cas_no') !== -1 ? header.indexOf('cas_no') : -1);
      const lelIndex = (lelColName in idx) ? idx[lelColName] : -1;

      // Collect usable records
      const records = [];
      for (let r = 1; r < rows.length; r++){
        const row = rows[r];
        if (!row) continue;
        const nbpNum = toNum(row[nbpIndex]);
        const mwtNum = toNum(row[mwtIndex]);
        const chemName = (row[nameIndex] !== undefined) ? row[nameIndex] : '';
        const casNum = (casIndex >= 0 && row[casIndex] !== undefined) ? row[casIndex] : '';
        const lelNum = (lelIndex >= 0 && row[lelIndex] !== undefined) ? row[lelIndex] : '';
        if (Number.isFinite(nbpNum) && Number.isFinite(mwtNum)) {
          records.push({ nbp: nbpNum, mwt: mwtNum, name: chemName, cas: casNum, lel: lelNum, rowIndex: r });
        }
      }

      if (records.length === 0) throw new Error('No usable records with numeric NBP and molecular weight were found.');

      // compute min/max ranges
      let nbpMin = Infinity, nbpMax = -Infinity, mwtMin = Infinity, mwtMax = -Infinity;
      records.forEach(rec => {
        if (rec.nbp < nbpMin) nbpMin = rec.nbp;
        if (rec.nbp > nbpMax) nbpMax = rec.nbp;
        if (rec.mwt < mwtMin) mwtMin = rec.mwt;
        if (rec.mwt > mwtMax) mwtMax = rec.mwt;
      });

      const nbpRange = (nbpMax - nbpMin) || Math.max(1, Math.abs(nbpMin));
      const mwtRange = (mwtMax - mwtMin) || Math.max(1, Math.abs(mwtMin));

      records.forEach(rec => {
        const dN = (rec.nbp - nbpVal) / nbpRange;
        const dM = (rec.mwt - mwtVal) / mwtRange;
        rec.distance = Math.sqrt(dN*dN + dM*dM);
        rec.dNBP = rec.nbp - nbpVal;
        rec.dMWT = rec.mwt - mwtVal;
      });

      records.sort((a,b) => a.distance - b.distance);

      const top = records.slice(0,20);
      setResults(top);
    } catch (err) {
        setError(err.message || String(err));
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Find closest chemicals by NBP (K) and Molecular Weight</h1>
        <p className="lead">Enter a normal boiling point (nbp, in K) and a molecular weight (g·mol⁻¹). The tool will find the 20 records in data/cheminfo_with_nbp.csv with nbp and mwt closest to your input.</p>
      </header>

      <div className="card">
        <form className="form-row" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="nbpInput">NBP (deg K)</label>
            <input
              id="nbpInput"
              name="nbp"
              type="number"
              step="any"
              min="-273.15"
              required
              placeholder="e.g. 350"
              value={nbpInput}
              onChange={(e) => setNbpInput(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="mwtInput">Molecular weight (g·mol⁻¹)</label>
            <input
              id="mwtInput"
              name="mwt"
              type="number"
              step="any"
              min="0"
              required
              placeholder="e.g. 180.16"
              value={mwtInput}
              onChange={(e) => setMwtInput(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'flex-end' }}>
            <button id="findBtn" type="submit" disabled={loading}>
              {loading ? 'Loading CSV...' : 'Find closest 20'}
            </button>
            <div className="small muted">CSV path: <code>data/cheminfo_with_nbp.csv</code></div>
          </div>
        </form>

        <div id="results">
          {error && <div className="error" role="alert">{error}</div>}

          {!error && results.length === 0 && !loading && (
            <div className="muted" style={{ marginTop: 10 }}>
              No results yet. Enter values above and click "Find closest 20".
            </div>
          )}

          {!error && results.length > 0 && (
            <>
              <div className="small muted">
                Showing {results.length} closest matches to NBP = {nbpInput} K and MWT = {mwtInput} g·mol⁻¹ (sorted by combined normalized distance)
              </div>

              <table aria-label="Closest chemicals table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Chemical name</th>
                    <th>CAS #</th>
                    <th style={{ textAlign: 'right' }}>NBP (K)</th>
                    <th style={{ textAlign: 'right' }}>MW (g·mol⁻¹)</th>
                    <th style={{ textAlign: 'right' }}>LFL (ppm)</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i}>
                      <td>{i+1}</td>
                      <td>{escapeHtml(r.name || '')}</td>
                      <td>{escapeHtml(r.cas || '')}</td>
                      <td style={{ textAlign: 'right' }}>{formatNumber(r.nbp)}</td>
                      <td style={{ textAlign: 'right' }}>{formatNumber(r.mwt)}</td>
                      <td style={{ textAlign: 'right' }}>{r.lel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        <div className="note">
          Important: The CSV must be accessible via the server at the path above (same origin). If you're testing locally, run a simple local web server (for example: <code>python -m http.server</code>) from the folder that contains the public files and the data/ folder.
        </div>
      </div>
    </div>
  );
};

export default ClosestChemicals;
