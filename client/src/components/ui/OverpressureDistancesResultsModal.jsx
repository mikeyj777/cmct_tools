import React, { useEffect, useRef } from 'react';

// Format numbers with 2 decimal places, return '—' if invalid
const formatNumber = (value) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(Number(value));
};

const OverpressureDistancesResultsModal = ({ volumes = [], onClose }) => {
  const overlayRef = useRef(null);
  const firstFocusableRef = useRef(null);
  const lastFocusedElementRef = useRef(null);

  // Trap focus and close with ESC
  useEffect(() => {
    lastFocusedElementRef.current = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    if (firstFocusableRef.current) firstFocusableRef.current.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const focusable = overlayRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      if (lastFocusedElementRef.current) lastFocusedElementRef.current.focus();
    };
  }, [onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  return (
    <div
      ref={overlayRef}
      className="results-modal-overlay"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        className="results-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="results-modal-title"
        aria-describedby="results-modal-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="results-modal-header">
          <h2 id="results-modal-title">Distances to Overpressure Limits (VCE)</h2>
          <p id="results-modal-desc" className="visually-hidden">
            List of congested volumes with location and table of distances to target overpressures.
          </p>
          <button
            ref={firstFocusableRef}
            className="close-button-icon"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </header>

        <div className="results-modal-body">
          {volumes && volumes.length > 0 ? (
            <div className="cards-grid">
              {volumes.map((v) => {
                const distances = v.overpressureDistances || {};
                const psiEntries = Object.entries(distances)
                  .map(([psi, dist]) => ({ psi, dist }))
                  .sort((a, b) => {
                    const na = Number(a.psi), nb = Number(b.psi);
                    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
                    return a.psi.localeCompare(b.psi);
                  });

                // Ensure exactly 3 rows
                const maxRows = 3;
                const tableRows = psiEntries.slice(0, maxRows);
                while (tableRows.length < maxRows) tableRows.push(null);

                const status = v.overpressureDistancesError
                  ? `Error: ${v.overpressureDistancesError}`
                  : psiEntries.length > 0 ? 'OK' : 'No data';

                return (
                  <article key={v.id} className="volume-card">
                    <div className="volume-card-header">
                      <h3 className="volume-id">{v.id}</h3>
                      <span className={`status-pill ${
                        status === 'OK' ? 'ok' :
                        status.startsWith('Error') ? 'error' : 'nodata'
                      }`}>
                        {status}
                      </span>
                    </div>

                    <div className="location">
                      <div className="location-row">
                        <span className="label">Latitude:</span>
                        <span className="value">
                          {Number.isFinite(v.position?.lat)
                            ? v.position?.lat.toFixed(6)
                            : '—'}
                        </span>
                      </div>
                      <div className="location-row">
                        <span className="label">Longitude:</span>
                        <span className="value">
                          {Number.isFinite(v.position?.lng)
                            ? v.position?.lng.toFixed(6)
                            : '—'}
                        </span>
                      </div>
                      <div className="location-row">
                        <span className="label">Distance from Release (m):</span>
                        <span className="value">
                          {Number.isFinite(v.distance)
                            ? v.distance?.toFixed(2)
                            : '—'}
                        </span>
                      </div>
                    </div>
                    


                    <span className="label">Distance from Release (m):</span>
                        <span className="value">
                          {Number.isFinite(v.distance)
                            ? v.distance.toFixed(2)
                            : '—'}
                        </span>

                    <div className="distances-table-wrapper">
                      <table className="distances-table" aria-label={`Overpressure distances for ${v.id}`}>
                        <thead>
                          <tr>
                            <th scope="col">Overpressure (psi)</th>
                            <th scope="col">Distance (m)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tableRows.map((entry, idx) => (
                            <tr key={idx}>
                              <td className="td-psi">{entry ? entry.psi : '—'}</td>
                              <td className="td-dist">{entry ? formatNumber(entry.dist) : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="no-volumes">No congested volumes found.</p>
          )}
        </div>

        <footer className="results-modal-footer">
          <button className="close-button" onClick={onClose}>Close</button>
        </footer>
      </div>
    </div>
  );
};

export default OverpressureDistancesResultsModal;
