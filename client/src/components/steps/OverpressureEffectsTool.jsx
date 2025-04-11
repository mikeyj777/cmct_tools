import React, { useState, useEffect } from 'react'; import { getApiUrl } from '../../utils/mapUtils';

const apiUrl = getApiUrl();

const OverpressureEffectsTool = ({
  jsonData,
  buildings,
  congestedVolumes,
  flammableExtentData,
  updateGuidanceBanner,
  onBuildingsUpdate
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [buildingsWithOverpressure, setBuildingsWithOverpressure] = useState([]);
  const [calculationComplete, setCalculationComplete] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      const response = await fetch(`${apiUrl}/api/vce_get_building_overpressure_results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const resultData = await response.json();

      // Update buildings with overpressure data
      setBuildingsWithOverpressure(resultData['updatedBuildings']);

      // Call the parent component's update function
      if (onBuildingsUpdate) {
        onBuildingsUpdate(resultData);
      }

      setCalculationComplete(true);
      setIsModalOpen(true);
      updateGuidanceBanner('Overpressure effects calculated successfully!', 'success');
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
          Calculate the overpressure effects on buildings based on the congested volumes
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

const ResultsModal = ({ buildingsWithOverpressure, onClose }) => {
  // Effect to handle escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    // Prevent scrolling on the background when modal is open
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = originalStyle;
    };
  }, [onClose]);

  // Handle click outside modal to close it
  const handleOutsideClick = (e) => {
    if (e.target.className === 'results-modal-overlay') {
      onClose();
    }
  };

  // Stop propagation for clicks inside modal content
  const handleModalContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="results-modal-overlay" onClick={handleOutsideClick}>
      <div className="results-modal-content" onClick={handleModalContentClick}>
        <div className="results-modal-header">
          <h3>Building Overpressure Results</h3>
          <button className="close-button-icon" onClick={onClose}>×</button>
        </div>

        <div className="results-modal-body">
          {buildingsWithOverpressure.length > 0 ? (
            <div className="table-container">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Building Name</th>
                    <th>Occupancy Level</th>
                    <th>Max Overpressure (psi)</th>
                  </tr>
                </thead>
                <tbody>
                  {buildingsWithOverpressure.map((building, index) => (
                    <tr key={index}>
                      <td>{building.name}</td>
                      <td>{building.occupancy}</td>
                      <td>
                        {building.max_overpressure_psi
                          ? building.max_overpressure_psi.toFixed(2)
                          : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No building data with overpressure results available.</p>
          )}
        </div>

        <div className="results-modal-footer">
          <button className="close-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OverpressureEffectsTool;
