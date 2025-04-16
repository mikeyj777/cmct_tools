import React, { useState, useEffect } from 'react'; 
import ResultsModal from '../ui/ResultsModal';
import { getApiUrl } from '../../utils/mapUtils';


const apiUrl = getApiUrl();

const VceEffectsTool = ({
  jsonData,
  buildings,
  congestedVolumes,
  flammableExtentData,
  updateGuidanceBanner,
  onBuildingsUpdate
}) => {
  const [resultData, setResultData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [buildingsWithOverpressure, setBuildingsWithOverpressure] = useState([]);
  const [calculationComplete, setCalculationComplete] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!resultData || !resultData['updatedBuildings']) return;

      const modeledBldgs = resultData['updatedBuildings'];

      const updatedBuildings = buildings.map((curr, idx) => {
        return {
          ...curr,
          max_overpressure_psi: modeledBldgs[idx].max_overpressure_psi
        }
      });

      if (onBuildingsUpdate) {
          onBuildingsUpdate(updatedBuildings);
      }

      setBuildingsWithOverpressure(updatedBuildings);
      setIsModalOpen(true);

  }, [resultData]);

  const calculateOverpressure = async () => {
    if (!jsonData || !buildings || !congestedVolumes || !flammableExtentData) {
      updateGuidanceBanner(
        'Please complete all previous steps before calculating overpressure effects.',
        'error'
      );
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      updateGuidanceBanner('Calculating overpressure effects...', 'info');

      // Prepare data for the API call
      const requestData = {
        flash_data: flammableExtentData.flash_data,
        buildings: buildings,
        volumes: congestedVolumes
      };

      // Make API call to get overpressure results
      const response = await fetch(`${apiUrl}/api/vce_get_overpressure_results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      setResultData(await response.json());

      updateGuidanceBanner('Overpressure effects calculated successfully!', 'success');
      setCalculationComplete(true);
    } catch (err) {
      console.error('Error calculating overpressure effects:', err);
      setError(`Failed to calculate overpressure effects: ${err.message}`);
      updateGuidanceBanner(`Error: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // When modal opens, prevent body scrolling
  useEffect(() => {
    if (isModalOpen) {
      // Store original overflow style
      const originalStyle = window.getComputedStyle(document.body).overflow;

      // Prevent scrolling on the body
      document.body.style.overflow = 'hidden';

      // Cleanup function to restore original body overflow when modal closes
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
    // No cleanup needed if modal isn't open
    return undefined;
  }, [isModalOpen]);

  return (
    <div className="overpressure-effects-tool">
      <div className="section-info">
        <p>
          Calculate the vce overpressure effects on buildings based on the congested volumes
          and flammable extent data. This will determine the potential impact on each
          building.
        </p>
      </div>
      <div className="tool-controls">
        <button
          className="primary-button"
          onClick={calculateOverpressure}
          disabled={isLoading || !buildings || !congestedVolumes || !flammableExtentData}
        >
          {isLoading ? 'Calculating...' : 'Calculate Overpressure Effects'}
        </button>
      </div>
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {/* Modal Portal - Render at the document root to avoid stacking context issues */}
      {isModalOpen && (
        <ResultsModal
          buildingsWithOverpressure={buildingsWithOverpressure}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default VceEffectsTool;
