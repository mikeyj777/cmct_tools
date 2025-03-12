import React, { useState, useEffect } from 'react';

const FlammableMassTool = ({
  jsonData,
  flammableExtentData,
  currentReleaseLocation,
  congestedVolumes,
  updateGuidanceBanner,
  onCongestedVolumesUpdate,
  onFlammableMassCalculated
}) => {
  const [calculatedVolumes, setCalculatedVolumes] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [currentCalculationIndex, setCurrentCalculationIndex] = useState(null);

  // Validate prerequisites before calculation
  const canCalculateMass = () => {
    if (!jsonData) {
      updateGuidanceBanner('Please load JSON data first', 'error');
      return false;
    }

    if (!flammableExtentData || !flammableExtentData.flammable_envelope_list_of_dicts) {
      updateGuidanceBanner('Please complete flammable extent calculation first', 'error');
      return false;
    }

    if (!currentReleaseLocation) {
      updateGuidanceBanner('Please set release location first', 'error');
      return false;
    }

    if (congestedVolumes.length === 0) {
      updateGuidanceBanner('Please identify congested volumes first', 'error');
      return false;
    }

    return true;
  };

  // Sequential mass calculation to prevent overwhelming the server
  const calculateFlammableMassSequentially = async () => {
    if (!canCalculateMass()) return;

    setIsCalculating(true);
    updateGuidanceBanner('Starting flammable mass calculations...', 'default');

    const releaseLat = parseFloat(currentReleaseLocation.lat);
    const releaseLng = parseFloat(currentReleaseLocation.lng);

    try {
      const updatedVolumes = await congestedVolumes.reduce(async (previousPromise, volume, index) => {
        const accumulatedVolumes = await previousPromise;

        // Update current calculation index for UI feedback
        setCurrentCalculationIndex(index);

        // Validate volume dimensions
        if (!volume.width || !volume.length || !volume.height) {
          updateGuidanceBanner(`Skipping volume ${index + 1}: Missing dimensions`, 'warning');
          return [...accumulatedVolumes, {
            ...volume,
            flammableMassG: null,
            flammableMassError: 'Missing volume dimensions'
          }];
        }

        // Calculate volume extents based on release location
        const xMin = volume.position.lng - releaseLng;
        const xMax = xMin + volume.length;
        const yMin = volume.position.lat - releaseLat;
        const yMax = yMin + volume.width;
        const zMin = 0; // Ground level
        const zMax = volume.height + (volume.elevationAboveGrade || 0);

        try {
          const response = await fetch('/api/vce_get_flammable_mass', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              xMin,
              xMax,
              yMin,
              yMax,
              zMin,
              zMax,
              flammable_envelope_list_of_dicts: flammableExtentData.flammable_envelope_list_of_dicts
            })
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();

          // Update volume with flammable mass
          const updatedVolume = {
            ...volume,
            flammableMassG: data.flammable_mass_g,
            flammableMassDimensions: { xMin, xMax, yMin, yMax, zMin, zMax }
          };

          updateGuidanceBanner(`Calculated mass for volume ${index + 1}`, 'default');
          return [...accumulatedVolumes, updatedVolume];

        } catch (error) {
          console.error(`Error calculating mass for volume ${index + 1}:`, error);
          return [...accumulatedVolumes, {
            ...volume,
            flammableMassG: null,
            flammableMassError: error.message || 'Calculation failed'
          }];
        }
      }, Promise.resolve([]));

      // Update volumes in parent component
      onCongestedVolumesUpdate(updatedVolumes);
      onFlammableMassCalculated(updatedVolumes);
      setCalculatedVolumes(updatedVolumes);

      // Final status update
      const successCount = updatedVolumes.filter(v => v.flammableMassG !== null).length;
      const failCount = updatedVolumes.length - successCount;

      updateGuidanceBanner(
        `Mass calculation complete. ${successCount} successful, ${failCount} failed.`, 
        successCount === updatedVolumes.length ? 'success' : 'warning'
      );

    } catch (error) {
      console.error('Unexpected error during mass calculations:', error);
      updateGuidanceBanner('Unexpected error during mass calculations', 'error');
    } finally {
      setIsCalculating(false);
      setCurrentCalculationIndex(null);
    }
  };

  return (
    <div className="flammable-mass-container">
      <button 
        onClick={calculateFlammableMassSequentially}
        disabled={isCalculating}
        className="calculate-mass-button"
      >
        {isCalculating 
          ? `Calculating Mass (Volume ${(currentCalculationIndex || 0) + 1})` 
          : 'Update Congested Volumes to Determine Their Flammable Mass'}
      </button>

      {calculatedVolumes.length > 0 && (
        <div className="volume-mass-list">
          {calculatedVolumes.map((volume, index) => (
            <div key={volume.id} className="volume-mass-item">
              <span>Volume {index + 1}</span>
              {volume.flammableMassG !== null ? (
                <span>Flammable Mass: {volume.flammableMassG.toFixed(2)} g</span>
              ) : (
                <span className="error">{volume.flammableMassError || 'Mass Calculation Failed'}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FlammableMassTool;