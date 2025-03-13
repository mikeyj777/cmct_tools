import React, { useState } from 'react';

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
        flash_data: flammableExtentData,
        buildings: buildings,
        volumes: congestedVolumes
      };

      // Make API call to get overpressure results
      const response = await fetch('/api/vce_get_building_overpressure_results', {
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
      setBuildingsWithOverpressure(resultData);
      
      // Call the parent component's update function
      if (onBuildingsUpdate) {
        onBuildingsUpdate(resultData);
      }

      setCalculationComplete(true);
      updateGuidanceBanner('Overpressure effects calculated successfully!', 'success');
    } catch (err) {
      console.error('Error calculating overpressure effects:', err);
      setError(`Failed to calculate overpressure effects: ${err.message}`);
      updateGuidanceBanner(`Error: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="overpressure-effects-tool">
      <div className="section-info">
        <p>
          Calculate the overpressure effects on buildings based on the congested volumes 
          and flammable extent data. This will determine the potential impact on each building.
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

      {calculationComplete && buildingsWithOverpressure.length > 0 && (
        <div className="results-table-container">
          <h3>Building Overpressure Results</h3>
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
                  <td>{building.max_overpressure_psi ? building.max_overpressure_psi.toFixed(2) : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {calculationComplete && buildingsWithOverpressure.length === 0 && (
        <div className="info-message">
          <p>No building data with overpressure results available.</p>
        </div>
      )}
    </div>
  );
};

export default OverpressureEffectsTool;