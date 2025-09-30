// components/ClosestChemicals.jsx
import React, { useState } from 'react';
import {
  parseCSV,
  headerIndexMap,
  toNum,
  formatNumber,
  escapeHtml,
  celsiusToKelvin,
  kelvinToCelsius,
  computeNormalizedDistances
} from '../utils/helpers';

// Component: ClosestChemicals (search by any combination of nbp_deg_k, mw, loc_3, lel, flash_point_deg_k)
// - User enters NBP and Flash Point in °C (converted to K for matching)
// - Displays NBP and Flash Point in °C in output
const ClosestChemicals = () => {
  // input strings (allow empty)
  const [nbpC, setNbpC] = useState('');
  const [mw, setMw] = useState('');
  const [loc3, setLoc3] = useState('');
  const [lel, setLel] = useState('');
  const [flashC, setFlashC] = useState('');

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

    // Prepare query object. Convert temperatures from °C to K when present.
    const query = {};
    const nbpCnum = toNum(nbpC);
    const flashCnum = toNum(flashC);
    const mwnum = toNum(mw);
    const loc3num = toNum(loc3);
    const lelnum = toNum(lel);

    if (Number.isFinite(nbpCnum)) query['nbp_deg_k'] = celsiusToKelvin(nbpCnum);
    if (Number.isFinite(flashCnum)) query['flash_point_deg_k'] = celsiusToKelvin(flashCnum);
    if (Number.isFinite(mwnum)) query['mw'] = mwnum;
    if (Number.isFinite(loc3num)) query['loc_3'] = loc3num;
    if (Number.isFinite(lelnum)) query['lel'] = lelnum;

    // Require at least one query value
    if (Object.keys(query).length === 0) {
      setError('Please enter at least one search value (NBP, MWT, ERPG-3, LFL, or Flash Point).');
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch('data/cheminfo_with_nbp_and_fp.csv');
      if (!resp.ok) throw new Error(`Could not fetch CSV: ${resp.status} ${resp.statusText}`);
      const text = await resp.text();
      const rows = parseCSV(text);
      if (!rows || rows.length < 2) throw new Error('CSV appears empty or malformed.');

      const header = rows[0].map(h => h.trim());
      const idx = headerIndexMap(header);

      // Ensure required exact columns exist in header for mapping; we will ignore missing columns when collecting records.
      // We expect CSV columns names exactly: nbp_deg_k, mw, loc_3, lel, flash_point_deg_k, cas_no, chem_name

      const requiredCols = ['cas_no','chem_name','nbp_deg_k','mw','loc_3','lel','flash_point_deg_k'];
      // But we will not fail if some optional columns are missing; only cas_no and chem_name are helpful
      // Check whether at least the numeric columns used in query exist in header
      for (const qk of Object.keys(query)) {
        if (!(qk in idx)) {
          throw new Error(`CSV is missing required column "${qk}". CSV must contain exact column names: nbp_deg_k, mw, loc_3, lel, flash_point_deg_k`);
        }
      }

      // Build records: ensure numeric values for fields present
      const records = [];
      for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row) continue;

        // read numeric values only for the expected columns; if missing or NaN then set NaN
        const rec = {
          rowIndex: r,
          cas_no: (idx.cas_no !== undefined && row[idx.cas_no] !== undefined) ? row[idx.cas_no] : '',
          chem_name: (idx.chem_name !== undefined && row[idx.chem_name] !== undefined) ? row[idx.chem_name] : ''
        };

        // numeric fields
        const nbpK = (idx.nbp_deg_k !== undefined) ? toNum(row[idx.nbp_deg_k]) : NaN;
        const mwVal = (idx.mw !== undefined) ? toNum(row[idx.mw]) : NaN;
        const loc3Val = (idx.loc_3 !== undefined) ? toNum(row[idx.loc_3]) : NaN;
        const lelVal = (idx.lel !== undefined) ? toNum(row[idx.lel]) : NaN;
        const flashK = (idx.flash_point_deg_k !== undefined) ? toNum(row[idx.flash_point_deg_k]) : NaN;

        // store using exact property names used by computeNormalizedDistances
        rec['nbp_deg_k'] = nbpK;
        rec['mw'] = mwVal;
        rec['loc_3'] = loc3Val;
        rec['lel'] = lelVal;
        rec['flash_point_deg_k'] = flashK;

        // Only include records that have at least one numeric value for any queried key
        let usable = false;
        for (const qk of Object.keys(query)) {
          if (Number.isFinite(rec[qk])) { usable = true; break; }
        }
        if (usable) records.push(rec);
      }

      if (records.length === 0) throw new Error('No usable records with numeric values matching provided fields were found.');

      // keys to consider are exactly the keys present in query
      const keys = Object.keys(query);

      // compute normalized distances (function divides by per-key ranges and averages)
      computeNormalizedDistances(records, query, keys);

      // sort by distance
      records.sort((a,b) => a.distance - b.distance);

      // take top 20
      const top = records.slice(0, 20);

      // For display, convert temperatures (nbp_deg_k and flash_point_deg_k) to °C
      const displayRows = top.map(r => ({
        cas_no: r.cas_no,
        chem_name: r.chem_name,
        nbp_C: Number.isFinite(r.nbp_deg_k) ? kelvinToCelsius(r.nbp_deg_k) : NaN,
        mw: r.mw,
        loc_3: r.loc_3,
        lel: r.lel,
        flash_C: Number.isFinite(r.flash_point_deg_k) ? kelvinToCelsius(r.flash_point_deg_k) : NaN,
        distance: r.distance
      }));

      setResults(displayRows);
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
        <h1>Find closest chemicals</h1>
        <p className="lead">Enter one or more fields. NBP and Flash Point inputs are in °C.</p>
      </header>

      <div className="card">
        <form className="form-row" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="nbpInput">NBP (°C)</label>
            <input
              id="nbpInput"
              name="nbp"
              type="number"
              step="any"
              placeholder="e.g. 77 (°C)"
              value={nbpC}
              onChange={(e) => setNbpC(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="mwInput">Molecular weight</label>
            <input
              id="mwInput"
              name="mw"
              type="number"
              step="any"
              placeholder="e.g. 180.16"
              value={mw}
              onChange={(e) => setMw(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="loc3Input">ERPG-3 (ppm)</label>
            <input
              id="loc3Input"
              name="loc3"
              type="number"
              step="any"
              placeholder="e.g. 5"
              value={loc3}
              onChange={(e) => setLoc3(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="lelInput">LFL (ppm)</label>
            <input
              id="lelInput"
              name="lel"
              type="number"
              step="any"
              placeholder="e.g. 1000"
              value={lel}
              onChange={(e) => setLel(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="flashInput">Flash Point (°C)</label>
            <input
              id="flashInput"
              name="flash"
              type="number"
              step="any"
              placeholder="e.g. 25 (°C)"
              value={flashC}
              onChange={(e) => setFlashC(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'flex-end' }}>
            <button id="findBtn" type="submit" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
            <div className="small muted">Click above to find the closest matching chemicals</div>
          </div>
        </form>

        <div id="results">
          {error && <div className="error" role="alert">{error}</div>}

          {!error && results.length === 0 && !loading && (
            <div className="muted" style={{ marginTop: 10 }}>No results yet. Enter values above and click "Find closest 20".</div>
          )}

          {!error && results.length > 0 && (
            <>
              <div className="small muted">
                Showing {results.length} closest matches (sorted by combined normalized distance)
              </div>

              <table aria-label="Closest chemicals table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>CAS No</th>
                    <th>Chem Name</th>
                    <th style={{ textAlign: 'right' }}>NBP (°C)</th>
                    <th style={{ textAlign: 'right' }}>MWT</th>
                    <th style={{ textAlign: 'right' }}>ERPG-3 (ppm) </th>
                    <th style={{ textAlign: 'right' }}>LFL (ppm)</th>
                    <th style={{ textAlign: 'right' }}>Flash Point (°C)</th>
                  </tr>
                </thead>
                <tbody>
                {results.map((r, i) => (
                    <tr key={i}>
                      <td>{i+1}</td>
                      <td>{escapeHtml(r.cas_no || '')}</td>
                      <td>{escapeHtml(r.chem_name || '')}</td>
                      <td style={{ textAlign: 'right' }}>{Number.isFinite(r.nbp_C) ? formatNumber(r.nbp_C) : ''}</td>
                      <td style={{ textAlign: 'right' }}>{Number.isFinite(r.mw) ? formatNumber(r.mw) : ''}</td>
                      <td style={{ textAlign: 'right' }}>{Number.isFinite(r.loc_3) ? formatNumber(r.loc_3) : ''}</td>
                      <td style={{ textAlign: 'right' }}>{Number.isFinite(r.lel) ? formatNumber(r.lel) : ''}</td>
                      <td style={{ textAlign: 'right' }}>{Number.isFinite(r.flash_C) ? formatNumber(r.flash_C) : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        <div className="note">
          Important: CSV must contain exact column names: nbp_deg_k, mw, loc_3, lel, flash_point_deg_k, cas_no, chem_name.
          NBP and Flash Point inputs are in °C and are converted to K for internal matching; displayed results show °C.
        </div>
      </div>
    </div>
  );
};

export default ClosestChemicals;

