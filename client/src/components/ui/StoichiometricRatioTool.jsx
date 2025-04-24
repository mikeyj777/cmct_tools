import React, { useState, useEffect } from 'react';

const StoichiometricRatioTool = ({ 
  flammableExtentData,
  onStoichCalculation,
  onClose
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [chemicals, setChemicals] = useState([]);
  const [stoichRatios, setStoichRatios] = useState({});
  const [calculatedRatio, setCalculatedRatio] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Initialize component with data from flammableExtentData
    if (flammableExtentData && flammableExtentData.flash_data) {
      const chemNames = flammableExtentData.flash_data.chem_mix_names || [];
      setChemicals(chemNames);
      
      // Initialize stoichRatios with empty values for each chemical
      const initialRatios = {};
      chemNames.forEach(chem => {
        initialRatios[chem] = '';
      });
      setStoichRatios(initialRatios);
    } else {
      setError('Flash data not available or invalid');
    }
  }, [flammableExtentData]);

  const handleInputChange = (chemical, value) => {
    setStoichRatios(prev => ({
      ...prev,
      [chemical]: value
    }));
  };

  const handleCalculate = () => {
    try {
      // Check if we have all the required inputs
      const missingInputs = Object.keys(stoichRatios).filter(chem => 
        stoichRatios[chem] === '' || isNaN(parseFloat(stoichRatios[chem]))
      );
      
      if (missingInputs.length > 0) {
        setError(`Missing stoichiometric ratios for: ${missingInputs.join(', ')}`);
        return;
      }

      // Get the mole fractions from flash_data.ys
      const moleFractions = flammableExtentData.flash_data.ys || [];
      
      if (moleFractions.length !== chemicals.length) {
        setError('Mole fraction data does not match chemical components');
        return;
      }

      // Calculate weighted average of stoichiometric O2 requirement
      let totalStoichO2 = 0;
      let totalMoleFraction = 0;

      chemicals.forEach((chem, index) => {
        const stoichRatio = parseFloat(stoichRatios[chem]);
        const moleFraction = parseFloat(moleFractions[index]);
        
        if (!isNaN(stoichRatio) && !isNaN(moleFraction)) {
          totalStoichO2 += stoichRatio * moleFraction;
          totalMoleFraction += moleFraction;
        }
      });

      // Normalize by total mole fraction (should be close to 1.0)
      if (totalMoleFraction > 0) {
        const weightedAvgStoichRatio = totalStoichO2 / totalMoleFraction;
        setCalculatedRatio(weightedAvgStoichRatio.toFixed(3));
        
        // Pass the calculated value back to the parent component
        onStoichCalculation(weightedAvgStoichRatio.toString());
        setError('');
      } else {
        setError('Invalid mole fraction data');
      }
    } catch (err) {
      setError(`Calculation error: ${err.message}`);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content stoich-ratio-modal">
        <h3>Stoichiometric Oxygen to Fuel Ratio</h3>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="stoich-ratio-description">
          Enter the moles of oxygen required for complete combustion of 1 mole of each chemical component.
        </div>
        
        {chemicals.length > 0 ? (
          <div className="stoich-ratio-table-container">
            <table className="stoich-ratio-table">
              <thead>
                <tr>
                  <th>Chemical Component</th>
                  <th>Stoichiometric Moles of O₂</th>
                </tr>
              </thead>
              <tbody>
                {chemicals.map((chemical, index) => (
                  <tr key={index}>
                    <td>{chemical}</td>
                    <td>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={stoichRatios[chemical]}
                        onChange={(e) => handleInputChange(chemical, e.target.value)}
                        className="stoich-input"
                        placeholder="Enter value"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-data-message">No chemical components available</div>
        )}
        
        {calculatedRatio !== null && (
          <div className="calculated-ratio">
            <span>Calculated O₂ to Fuel Ratio:</span> 
            <span className="ratio-value">{calculatedRatio}</span>
          </div>
        )}
        
        <div className="form-buttons">
          <button 
            className="primary-button" 
            onClick={handleCalculate}
            disabled={chemicals.length === 0}
          >
            Calculate Ratio
          </button>
          <button className="ok-button" onClick={handleClose}>
            Use This Value & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoichiometricRatioTool;