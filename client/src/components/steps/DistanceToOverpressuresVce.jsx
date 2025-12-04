import React, { useState, useEffect } from 'react';
import { calculateVolumeExtents } from '../../utils/geospatial';
import { getApiUrl } from '../../utils/mapUtils';


const apiUrl = getApiUrl();

const DistanceToOverpressuresVce = ({
  isOpen,
  onClose,
  jsonData,
  flammableExtentData,
  currentReleaseLocation,
  congestedVolumes,
  updateGuidanceBanner,
  onCongestedVolumesUpdate,
  initialPsiValues = [0.5, 1, 2] // defaults in psi
}) => {
  const [psi1, setPsi1] = useState(initialPsiValues[0] ?? '');
  const [psi2, setPsi2] = useState(initialPsiValues[1] ?? '');
  const [psi3, setPsi3] = useState(initialPsiValues[2] ?? '');
  const [isCalculating, setIsCalculating] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(null);

  // Disable background scroll and close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isCalculating) onClose();
    };
    document.addEventListener('keydown', handleEscape);

    const originalOverflow = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, isCalculating, onClose]);

  if (!isOpen) return null;

  const validatePrereqs = () => {
    if (!jsonData) {
      updateGuidanceBanner('Please load JSON data first', 'error');
      return false;
    }
    if (!flammableExtentData?.flammable_envelope_list_of_dicts) {
      updateGuidanceBanner('Please complete flammable extent calculation first', 'error');
      return false;
    }
    if (!currentReleaseLocation) {
      updateGuidanceBanner('Please set release location first', 'error');
      return false;
    }
    if (!congestedVolumes || congestedVolumes.length === 0) {
      updateGuidanceBanner('Please identify congested volumes first', 'error');
      return false;
    }
    return true;
  };

  const parsePsiInputs = () => {
    const vals = [psi1, psi2, psi3].map((v) => (typeof v === 'string' ? parseFloat(v) : v));
    const invalid = vals.some((v) => !Number.isFinite(v) || v <= 0);
    return { vals, invalid };
  };

  const handleOk = async () => {
    if (!validatePrereqs()) return;
    const { vals, invalid } = parsePsiInputs();
    if (invalid) {
      updateGuidanceBanner('Please enter three positive pressure values (psi).', 'error');
      return;
    }

    setIsCalculating(true);
    setCurrentIdx(null);
    updateGuidanceBanner('Starting distance-to-overpressure calculations...', 'default');

    try {
      const updated = await congestedVolumes.reduce(async (accP, vol, idx) => {
        const acc = await accP;
        setCurrentIdx(idx);

        if (!vol.width || !vol.length || !vol.height) {
          updateGuidanceBanner(`Skipping volume ${idx + 1}: Missing dimensions`, 'warning');
          return [...acc, {
            ...vol,
            overpressureDistances: null,
            overpressureDistancesError: 'Missing volume dimensions'
          }];
        }
        if (vol.flammableMassG == null || !Number.isFinite(vol.flammableMassG)) {
          updateGuidanceBanner(`Skipping volume ${idx + 1}: Missing flammable mass`, 'warning');
          return [...acc, {
            ...vol,
            overpressureDistances: null,
            overpressureDistancesError: 'Missing flammable mass'
          }];
        }

        let dims;
        try {
          dims = calculateVolumeExtents(vol, currentReleaseLocation);
        } catch (e) {
          return [...acc, {
            ...vol,
            overpressureDistances: null,
            overpressureDistancesError: 'Failed to compute extents'
          }];
        }

        const { xMin, xMax, yMin, yMax, zMin, zMax } = dims;

        try {
          const response = await fetch(`${apiUrl}/api/vce_get_distances_to_overpressures`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              xMin,
              xMax,
              yMin,
              yMax,
              zMin,
              zMax,
              flash_data: flammableExtentData.flash_data,
              overpressuresPsi: vals,
              flammableMassG: vol.flammableMassG,
              isIndoors: vol.isIndoors,
              congestionLevel: vol.congestionLevel
            })
          });

          if (!response.ok) throw new Error(`HTTP error ${response.status}`);

          const data = await response.json();
          if (!data || !Array.isArray(data.distances_m) || data.distances_m.length !== vals.length) {
            throw new Error('Unexpected response format from distances API');
          }

          const distancesMap = vals.reduce((m, psi, i) => {
            m[`${psi}psi`] = data.distances_m[i];
            return m;
          }, {});

          updateGuidanceBanner(`Calculated distances for volume ${idx + 1}`, 'default');

          return [...acc, {
            ...vol,
            overpressureDistances: distancesMap,
            overpressureDistancesError: null
          }];
        } catch (err) {
          console.error(`Error calculating distances for volume ${idx + 1}:`, err);
          return [...acc, {
            ...vol,
            overpressureDistances: null,
            overpressureDistancesError: err?.message || 'Calculation failed'
          }];
        }
      }, Promise.resolve([]));

      onCongestedVolumesUpdate(updated);

      const okCount = updated.filter((v) => v.overpressureDistances && !v.overpressureDistancesError).length;
      const failCount = updated.length - okCount;
      updateGuidanceBanner(
        `Distance calculation complete. ${okCount} successful, ${failCount} failed.`,
        okCount === updated.length ? 'success' : 'warning'
      );

      onClose();
    } catch (e) {
      console.error('Unexpected error during distance calculations:', e);
      updateGuidanceBanner('Unexpected error during distance calculations', 'error');
    } finally {
      setIsCalculating(false);
      setCurrentIdx(null);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.className.includes('dto-vce-overlay') && !isCalculating) onClose();
  };

  return (
    <div className="dto-vce-overlay" onClick={handleOverlayClick}>
      <div className="dto-vce-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dto-vce-header">
          <h3>Identify distances to overpressure limits for VCE</h3>
          <button
            className="dto-vce-close-btn"
            onClick={onClose}
            disabled={isCalculating}
            aria-label="Close"
            title="Close"
          >
            ×
          </button>
        </div>

        <div className="dto-vce-body">
          <p>Enter three overpressure thresholds (psi). Distances will be calculated for all congested volumes.</p>

          <div className="dto-vce-input-group">
            <label>
              <span>Overpressure (psi) 1</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={psi1}
                onChange={(e) => setPsi1(e.target.value)}
                disabled={isCalculating}
              />
            </label>
            <label>
              <span>Overpressure (psi) 2</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={psi2}
                onChange={(e) => setPsi2(e.target.value)}
                disabled={isCalculating}
              />
            </label>
            <label>
              <span>Overpressure (psi) 3</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={psi3}
                onChange={(e) => setPsi3(e.target.value)}
                disabled={isCalculating}
              />
            </label>
          </div>

          {isCalculating && (
            <p className="dto-vce-status">
              Calculating distances {currentIdx != null ? `(Volume ${currentIdx + 1} of ${congestedVolumes.length})` : ''}…
            </p>
          )}
        </div>

        <div className="dto-vce-footer">
          <button className="dto-vce-cancel" onClick={onClose} disabled={isCalculating}>Cancel</button>
          <button className="dto-vce-ok" onClick={handleOk} disabled={isCalculating}>OK</button>
        </div>
      </div>
    </div>
  );
};

export default DistanceToOverpressuresVce;
