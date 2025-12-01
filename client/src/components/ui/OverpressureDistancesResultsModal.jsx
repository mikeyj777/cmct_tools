import React, { useEffect } from 'react';

const OverpressureDistancesResultsModal = ({ volumes, onClose }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);

    const originalOverflow = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose]);

  const handleOverlayClick = (e) => {
    if (e.target.className === 'results-modal-overlay') {
      onClose();
    }
  };

  return (
    <div className="results-modal-overlay" onClick={handleOverlayClick}>
      <div className="results-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="results-modal-header">
          <h3>Distances to Overpressure Limits (VCE)</h3>
          <button className="close-button-icon" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="results-modal-body">
          {volumes && volumes.length > 0 ? (
            <div className="table-container">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Volume ID</th>
                    <th>Distances (meters)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {volumes.map((v) => {
                    const pairs = v.overpressureDistances
                      ? Object.entries(v.overpressureDistances)
                      : [];
                    return (
                      <tr key={v.id}>
                        <td>{v.id}</td>
                        <td>
                          {pairs.length > 0
                            ? pairs.map(([psi, dist]) => `${psi}: ${Number(dist).toFixed(2)} m`).join(' | ')
                            : '—'}
                        </td>
                        <td>
                          {v.overpressureDistancesError
                            ? `Error: ${v.overpressureDistancesError}`
                            : (pairs.length > 0 ? 'OK' : 'No data')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No congested volumes found.</p>
          )}
        </div>

        <div className="results-modal-footer">
          <button className="close-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default OverpressureDistancesResultsModal;
