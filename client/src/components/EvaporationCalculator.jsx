//EvaporationCalculator.jsx

/**
 * EvaporationCalculator Component
 * 
 * This component provides a user interface for calculating the evaporation rate of chemicals in a lab hood environment.
 * Users can input hood dimensions, face velocity, and chemical components to compute the evaporation rate.
 * 
 * State Variables:
 * - hoodVelocity: string - The face velocity of the lab hood in feet per minute.
 * - hoodLength: string - The length of the lab hood in feet.
 * - hoodDepth: string - The depth of the lab hood in feet.
 * - chemicalInput: string - The input for searching chemicals by name or CAS number.
 * - componentAmount: string - The amount of the selected chemical component.
 * - isMolarBasis: boolean - Flag indicating if the input amounts are on a molar basis.
 * - mixtureComponents: array - List of chemical components added to the mixture.
 * - calculationComponents: array - List of chemical components used for calculations.
 * - filteredChemicals: array - List of chemicals filtered based on the search input.
 * - selectedChemical: object - The currently selected chemical from the search results.
 * - results: object - The calculated evaporation results.
 * - error: string - Error message for input validation and calculation errors.
 * - chemicalData: array - List of chemical data loaded from an external source.
 * - manualEntry: boolean - Flag indicating if manual input of molecular weight and vapor pressure is enabled.
 * - molecularWeightManual: string - Manually entered molecular weight of the chemical.
 * - vaporPressureManual: string - Manually entered vapor pressure of the chemical at 25°C.
 * - showHelp: boolean - Flag indicating if the help modal is displayed.
 * 
 * Handlers and Functions:
 * - useEffect: Loads chemical data on component mount and handles input changes.
 * - handleKeyPress: Adds a component to the mixture when the Enter key is pressed.
 * - handleChemicalSelect: Selects a chemical from the search results.
 * - handleAddComponent: Adds the selected chemical component to the mixture.
 * - removeComponent: Removes a chemical component from the mixture.
 * - calculateResults: Calculates the evaporation rate based on the input parameters.
 * 
 * returns JSX.Element The rendered EvaporationCalculator component.
 */

import React, { useState, useEffect } from 'react';
import {  
  calculateEvaporationRate,
  convertToMolarBasis,
  calculateConcentrationPpm
} from '../utils/evaporationUtils';
import '../styles/EvaporationCalculator.css';
import HelpModal from './ui/HelpModal';
import PhysProps from '../utils/getPhysProps';
import dynamicPoolEvap from '../utils/dynamicEvap';
import * as consts from '../utils/consts';

const EvaporationCalculator = () => {
  // Display state
  const [hoodVelocity, setHoodVelocity] = useState('');
  const [hoodLength, setHoodLength] = useState('');
  const [hoodDepth, setHoodDepth] = useState('');
  const [chemicalInput, setChemicalInput] = useState('');
  const [componentAmount, setComponentAmount] = useState('');
  const [isMolarBasis, setIsMolarBasis] = useState(false);
  const [mixtureComponents, setMixtureComponents] = useState([]);
  const [sashHeight, setSashHeight] = useState('');
  const [sashWidth, setSashWidth] = useState('');
  const [evapRateGramSec, setEvapRateGramSec] = useState('');
  const [concPpm, setConcPpm] = useState('');
  const [spillAmountML, setSpillAmountML] = useState('');
  const [liquidDensityLbGalManual, setLiquidDensityLbGalManual] = useState('');
  
  // Calculation state
  const [calculationComponents, setCalculationComponents] = useState([]);
  
  // Supporting state
  const [filteredChemicals, setFilteredChemicals] = useState([]);
  const [selectedChemical, setSelectedChemical] = useState('');
  const [results, setResults] = useState('');
  const [error, setError] = useState('');
  const [chemicalData, setChemicalData] = useState([]);
  const [physProps, setPhysProps] = useState(null);

  // state for manual input control
  const [manualEntry, setManualEntry] = useState(false);
  const [molecularWeightManual, setMolecularWeightManual] = useState('');
  const [vaporPressureManual, setVaporPressureManual] = useState('');

  //Help Modal
  const [showHelp, setShowHelp] = useState(false);


  useEffect(() => {
    const initializePhysProps = async () => {
      const props = new PhysProps();
      setPhysProps(props);
    };

    initializePhysProps();
    console.log("Thank you for using this tool");
    console.log("The basis for these calculations is a dissertation entitled 'Modelling spreading, vaporisation and dissolution of multi-component pools'");
    console.log("The paper summarizes different available methods for pool calculations.  Our model leverages calculations from a few sections.");
    console.log("Our model is based on a spill of a specified amount of liquid in a fume hood.  It will track the evaporation over an hour, reporting peak evaporation rate and total evaporated mass at specified intervals.");
    console.log("Source:  https://discovery.ucl.ac.uk/id/eprint/1386059/1/Maria%20Fernandez_PhD_public%20version.pdf");
    console.log("Contact Mike James (mjames@eastman.com) with any questions.");
  }, []);

  useEffect(() => {
    if (physProps && physProps.chemicalData.length > 0) {
      setChemicalData(physProps.chemicalData);
    }
  })

  useEffect(() => {
    if (chemicalInput.length > 0) {
      const searchTerm = chemicalInput.toLowerCase();
      const filtered = chemicalData.filter(chem => 
        chem.name.toLowerCase().includes(searchTerm) ||
        (chem.casNumber && chem.casNumber.includes(searchTerm))
      );
      setFilteredChemicals(filtered);
    } else {
      setFilteredChemicals([]);
    }
  }, [chemicalInput, chemicalData]);

  useEffect(() => {
    setResults('');
    setSashHeight('');
    setSashWidth('');
    setConcPpm('');
    setEvapRateGramSec('');
    setLiquidDensityLbGalManual('');
    setVaporPressureManual('');
    setMolecularWeightManual('');
  }, [mixtureComponents])

  useEffect(() => {
      setResults('');
      setSashHeight('');
      setSashWidth('');
      setConcPpm('');
      setEvapRateGramSec('');
  }, [hoodDepth, hoodLength, spillAmountML, hoodVelocity])

  // ----------------- tester -----------------------

  // useEffect( () => {
  //   if (mixtureComponents.length === 0) return;
  //   const chem = mixtureComponents[0];
  //   const temp_k = 298.15;
  //             //dynamicPoolEvap = (cas_no, temp_k, physProps, spillMassG, hoodVelocityFtMin)
  //   const val = dynamicPoolEvap(chem.casNumber, temp_k, physProps, 100, hoodVelocity);

  //   console.log(val);

  // }, [mixtureComponents])

  // -------------------------------------------------

  useEffect( () => {
    setMixtureComponents([]);
    setCalculationComponents([]);
    setMolecularWeightManual('');
    setVaporPressureManual('');
    setLiquidDensityLbGalManual('');
    setResults(null);
    setConcPpm(null);
  }, [manualEntry])

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddComponent();
    }
  };

  const handleChemicalSelect = (chemical) => {
    setSelectedChemical(chemical);
    setChemicalInput(`${chemical.name} | ${chemical.casNumber}`);
    setFilteredChemicals([]);
  };

  const normalizeToMolarBasis = (updatedMixtureComponents) => {
    let totalAmt = 0;
    const newMix = updatedMixtureComponents.map(tempChem => {
      let newAmount = tempChem.originalAmount;
      if (!isMolarBasis) newAmount = tempChem.originalAmount / tempChem.molecularWeight;
      totalAmt += newAmount;
      return {
        amount: newAmount,
        casNumber: tempChem.casNumber,
        molecularWeight: tempChem.molecularWeight,
        name: tempChem.name,
        vaporPressureConstants: tempChem.vaporPressureConstants,
        originalAmount: tempChem.originalAmount,
      };
    });
  
    const normalizedMix = newMix.map(tempChem => ({
      ...tempChem,
      amount: tempChem.amount / totalAmt
    }));
    return normalizedMix;
  }

  const handleAddComponent = () => {
    if (!selectedChemical) {
      setError('Please select a valid chemical from the dropdown');
      return;
    }
  
    if (!componentAmount) {
      setError('Please enter component amount');
      return;
    }
  
    const amount = parseFloat(componentAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid positive number');
      return;
    }
  
    const newComponent = {
      ...selectedChemical,
      amount,
      originalAmount: amount,
      isMolar: isMolarBasis
    };
  
    const updatedMixtureComponents = [...mixtureComponents, newComponent];
    setMixtureComponents(updatedMixtureComponents);
  
    setCalculationComponents(normalizeToMolarBasis(updatedMixtureComponents));
  
    // Reset inputs
    setChemicalInput('');
    setComponentAmount('');
    setSelectedChemical(null);
    setFilteredChemicals([]);
    setError('');
  };

  const removeComponent = (identifier) => {
    const updatedMixtureComponents = mixtureComponents.filter(comp => (comp.casNumber || comp.name) !== identifier);
    setMixtureComponents(updatedMixtureComponents);
    setCalculationComponents(normalizeToMolarBasis(updatedMixtureComponents));
  };

  const calcConc = () => {
    if (!evapRateGramSec || !sashHeight || !sashWidth) {
      setError('Please provide sash dimensions and complete evaporation rate calc.')
      return;
    }
    try {
      const concPpmResult = calculateConcentrationPpm(
        parseFloat(sashHeight), 
        parseFloat(sashWidth),
        parseFloat(hoodVelocity), 
        evapRateGramSec, 
        calculationComponents, 
        parseFloat(molecularWeightManual)
      )

      setConcPpm(concPpmResult);
      setError('');
    } catch (err) {
      setError('Error calculating concentration:' + err.message);
    }

  }

  const calculateResults = () => {
    if (!hoodVelocity || !hoodLength || !hoodDepth || !spillAmountML) {
      setError('Please provide all hood dimensions, spill amount and face velocity');
      return;
    }

    if (calculationComponents.length === 0 && (!manualEntry)) {
      setError('Please add at least one component to the mixture or use manual entry mode.');
      return;
    }

    try {
      

      const evapData = dynamicPoolEvap(
        calculationComponents,
        298.15,
        physProps,
        parseFloat(spillAmountML),
        parseFloat(hoodVelocity),
        parseFloat(hoodLength),
        parseFloat(hoodDepth),
        parseFloat(molecularWeightManual),
        parseFloat(vaporPressureManual),
        parseFloat(liquidDensityLbGalManual)
      );

      const maxEvapData = evapData.maxEvapRateAndTime;
      const totalGasEvapGforOutput = evapData.totalGasEvapGforOutput;
      const nulls = evapData.nulls;
      
      let completeEvapTimeStr = " > 1 hour";
      const completeEvapTimeSec = totalGasEvapGforOutput.timeToCompletelyEvaporateSec;
      if (completeEvapTimeSec) {
        const completeEvapTimeMin = completeEvapTimeSec / 60;

        completeEvapTimeStr = String(completeEvapTimeSec) + " sec";
        if (completeEvapTimeMin >= 1) completeEvapTimeStr = completeEvapTimeMin.toFixed(2) + " min";
      }

      setResults({
        peakEvapRate: maxEvapData.evapRateGperSec,
        timeToPeak: maxEvapData.timeSec,
        tenSeconds: totalGasEvapGforOutput[10],
        sixtySeconds: totalGasEvapGforOutput[60],
        oneHour: totalGasEvapGforOutput[3600],
        completeEvapTime: completeEvapTimeStr,
      });
      setError('');
      if (nulls.length > 0) {
        let err = "Some of the properties for provided chemicals are missing.  Substituting their values for those of water.  Missing properties: ";
        nulls.forEach(prop_id => {
            err += `${consts.LONG_FORM_PHYS_PROP_DESCRIPTIONS[prop_id]}, `;
        });
        // Remove the trailing comma and space
        err = err.trim().replace(/,$/, '');
        setError(err);
      }
      
      setEvapRateGramSec(maxEvapData.evapRateGperSec);
    } catch (err) {
      setError('Error calculating evaporation rate: ' + err.message);
    }
  };

  return (
    <div className="calculator-container">
      <div className="calculator-header">
        <h1 className="calculator-title">Lab Hood Evaporation Calculator</h1>
      </div>

      <button 
        onClick={() => setShowHelp(true)}
        className="help-button"
      >
        ?
      </button>

      {showHelp && (
        <div className="modal show" onClick={(e) => {
          if (e.target.className === 'modal show') {
            setShowHelp(false);
          }
        }}>
          <div className="modal-content">
            <button className="close" onClick={() => setShowHelp(false)}>×</button>
            <HelpModal />
          </div>
        </div>
      )}
      
      <div className="form-group">
        <label className="form-label">Hood Dimensions</label>
        <div className="dimension-inputs">
          <div>
            <label className="form-label">Length (ft)</label>
            <input
              type="number"
              value={hoodLength}
              onChange={(e) => setHoodLength(e.target.value)}
              placeholder="Enter length"
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Depth (ft)</label>
            <input
              type="number"
              value={hoodDepth}
              onChange={(e) => setHoodDepth(e.target.value)}
              placeholder="Enter depth"
              className="form-input"
            />
          </div>
        </div>
      </div>

      <div className="form-group">
        <div>
          <label className="form-label">Spill Amount (mL)</label>
          <input
            type="number"
            value={spillAmountML}
            onChange={(e) => setSpillAmountML(e.target.value)}
            placeholder="Enter height"
            className="form-input"
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="hood-velocity">
          Hood Face Velocity (ft/min)
        </label>
        <input
          id="hood-velocity"
          type="number"
          value={hoodVelocity}
          onChange={(e) => setHoodVelocity(e.target.value)}
          placeholder="Enter hood face velocity"
          className="form-input"
        />
      </div>
      {!manualEntry && (<div>
        <div className="form-group">
          <div className="basis-selection">
            <section>
              <p><strong>NOTE:  </strong>Checking the "Molar Basis" box will specify component amounts in terms of Moles.  When unchecked, component amounts are in terms of Mass.</p>
            </section>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isMolarBasis}
                onChange={(e) => setIsMolarBasis(e.target.checked)}
                disabled={mixtureComponents.length > 0}
                className="checkbox"
              />
              Molar Basis
            </label>
          </div>

          <label className="form-label">Add Mixture Component</label>
          <div className="component-input-row">
            <div className="chemical-input-container">
              <input
                value={chemicalInput}
                onChange={(e) => setChemicalInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Search by Chemical Name or CAS Number"
                className="form-input"
              />
              {filteredChemicals.length > 0 && (
                <div className="dropdown">
                  {filteredChemicals.map((chem) => (
                    <div
                      key={chem.casNumber || chem.name}
                      className="dropdown-item"
                      onClick={() => handleChemicalSelect(chem)}
                    >
                      {chem.name} | {chem.casNumber}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="amount-input-container">
              <input
                type="number"
                value={componentAmount}
                onChange={(e) => setComponentAmount(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Relative Amount (Amounts do not have to sum to 100)"
                className="form-input"
              />
            </div>

            <button
              className="add-button"
              onClick={handleAddComponent}
            >
              Add Chemical
            </button>
            <span className="note-text">NOTE: Click "Add Chemical" after entering data for each chemical.</span>
          </div>
        </div>

        {mixtureComponents.length > 0 && (
          <div className="mixture-summary">
            <h3>Mixture Components {isMolarBasis ? '(Molar Basis)' : '(Mass Basis)'}</h3>
            <table className="mixture-table">
              <thead>
                <tr>
                  <th className="table-header">Chemical</th>
                  <th className="table-header">CAS Number</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mixtureComponents.map((component) => (
                  <tr key={component.casNumber || component.name}>
                    <td className="table-cell">
                      {component.name}
                    </td>
                    <td className="table-cell">
                      {component.casNumber}
                    </td>
                    <td className="table-cell">
                      {component.originalAmount.toFixed(2)}
                    </td>
                    <td className="table-cell">
                      <button
                        className="remove-button"
                        onClick={() => removeComponent(component.casNumber || component.name)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>)}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={manualEntry}
            onChange={(e) => setManualEntry(e.target.checked)}
            className="checkbox"
          />
          Manually Input Required Parameters
        </label>

        {manualEntry && (
          <div className="manual-fields">
            <div>
              <label className="form-label">Molecular Weight (g/mol)</label>
              <input
                type="number"
                value={molecularWeightManual}
                onChange={(e) => setMolecularWeightManual(e.target.value)}
                className="form-input"
              />
            </div>
            
            <div>
              <label className="form-label">Vapor Pressure at 25°C (Pa)</label>
              <input
                type="number"
                value={vaporPressureManual}
                onChange={(e) => setVaporPressureManual(e.target.value)}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Liquid Density at 25°C (lb/gal)</label>
              <input
                type="number"
                value={liquidDensityLbGalManual}
                onChange={(e) => setLiquidDensityLbGalManual(e.target.value)}
                className="form-input"
              />
            </div>

          </div>
        )}
      </div>



      <button   
        className="calculate-button"
        onClick={calculateResults} 
        disabled={  !hoodVelocity || !hoodLength || !hoodDepth || 
          (mixtureComponents.length === 0 && (!molecularWeightManual || !vaporPressureManual)) || 
          (mixtureComponents.length === 0 && !manualEntry) || 
          !spillAmountML }> 

        Calculate Evaporation Rate 

      </button>

      {/* setResults({
        peakEvapRate: maxEvapData.evapRateGperSec,
        timeToPeak: maxEvapData.timeSec,
        tenSeconds: totalGasEvapGforOutput[10],
        sixtySeconds: totalGasEvapGforOutput[60],
        oneHour: totalGasEvapGforOutput[3600],
      }); */}

      {results && hoodDepth && hoodLength && spillAmountML && hoodVelocity && (
        <div className="results-container">
          <h3>Results:</h3>
          <p>Peak Evaporation Rate: {results.peakEvapRate.toFixed(6)} g/sec</p>
          <p>Time to Peak: {results.timeToPeak} sec</p>
          <p>Amount evaporated in 10 seconds: {results.tenSeconds ? results.tenSeconds.toFixed(2): "N/A"} g</p>
          <p>Amount evaporated in 60 seconds: {results.sixtySeconds ? results.sixtySeconds.toFixed(2) : "N/A"} g</p>
          <p>Amount evaporated in 1 hour: {results.oneHour ? results.oneHour.toFixed(2) : "N/A"} g</p>
          <p>Time for Material to Completely Evaporate: {results.completeEvapTime}</p>

        </div>
      )}

      {results && hoodDepth && hoodLength && spillAmountML && hoodVelocity && (
        <div className="form-group">
          <label className="form-label">Sash Dimensions</label>
          <div className="dimension-inputs">
            <div>
              <label className="form-label">Sash Height (ft)</label>
              <input
                type="number"
                value={sashHeight}
                onChange={(e) => setSashHeight(e.target.value)}
                placeholder="Enter height"
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Sash Width (ft)</label>
              <input
                type="number"
                value={sashWidth}
                onChange={(e) => setSashWidth(e.target.value)}
                placeholder="Enter width"
                className="form-input"
              />
            </div>
          </div>
        </div>

      )}

      <button   
        className="calculate-button"
        onClick={calcConc} 
        hidden={!sashHeight || ! sashWidth}
        disabled={ !sashHeight || ! sashWidth || !hoodVelocity || !hoodLength || !hoodDepth || 
          (mixtureComponents.length === 0 && (!molecularWeightManual || !vaporPressureManual)) || 
          (mixtureComponents.length === 0 && !manualEntry) }> 

        Calculate Concentration

      </button>

      {concPpm && (
        <div className="results-container">
          <h3>Results:</h3>
          <p>Estimated Concentration in Hood Exhaust: {concPpm.toFixed(6)} ppm</p>
        </div>
      )}

      <section>
          <h3>Contact</h3>
          <p>For questions or support, please contact Mike James (mjames@eastman.com)</p>
        </section>
    </div>
  );
};

export default EvaporationCalculator;
