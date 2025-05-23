﻿// src/components/RadiationAnalysis.jsx

import React, { useState, useEffect, useDebugValue } from 'react';
import PlotlyViewer from './PlotlyViewer';
import PlotlyProfileViewer from './PlotlyProfileViewer';
import Modal from './ui/Modal';
import { getApiUrl } from '../utils/mapUtils';

const apiUrl = getApiUrl();

// Define target elevations
const targetElevations = {
  groundLevel: 0,
  bottomPipeRack: 23 / 3.28084,
  topPipeRack: 42 / 3.28084
};

const formDataDefault = {
  windSpeedMph: 30,
  xFlare: 0,
  yFlare: 0,
  zFlare: 150,
  xTransectStart: 0,
  yTransectStart: 0,
  zTransectStart: 0,
  xTransectFinal: 500,
  yTransectFinal: 0,
  zTransectFinal: 0,
};

/**
 * RadiationAnalysis component for analyzing radiation from flares
 * Follows left-visualization, right-parameters layout pattern
 */
const RadiationAnalysis = () => {
  const [showPeakRadiationData, setShowPeakRadiationData] = useState(true);
  const [showCriticalData,setShowCriticalData] = useState(false);
  const [file, setFile] = useState(null);
  const [processData, setProcessData] = useState({});
  const [formData, setFormData] = useState(formDataDefault);
  const [plotData, setPlotData] = useState([]);
  const [profileData, setProfileData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [criticalData, setCriticalData] = useState({
    groundLevel: null,
    bottomPipeRack: null,
    topPipeRack: null
  });
  const [cache, setCache] = useState({});
  const [useCache, setUseCache] = useState(true);
  const [caseNum, setCaseNum] = useState(0);
  
  const [peakRadiationData, setPeakRadiationData] = useState({
    groundLevel: null,
    overall: null,
  })

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleUseCacheCheckboxChange = (event) => {
    setUseCache(event.target.checked);
    setCaseNum(0);
  };

  const handleShowCriticalDataCheckboxChange = (event) => {
    setUseCache(event.target.checked);
    setCaseNum(0);
  };

  const handleShowPeakRadiationDataCheckboxChange = (event) => {
    setUseCache(event.target.checked);
    setCaseNum(0);
  };

  useEffect(() => {
    if (!useCache) setCache({});
  },[useCache])

  /**
   * Calculate critical radiation levels at target elevations when plot data changes
   */
  useEffect(() => {
    if (plotData.length > 0) {
      const findClosestData = (targetZ) => {
        return plotData.reduce((prev, curr) =>
          Math.abs(curr.z - targetZ) < Math.abs(prev.z - targetZ) ? curr : prev
        );
      };

      setCriticalData({
        groundLevel: findClosestData(targetElevations.groundLevel),
        bottomPipeRack: findClosestData(targetElevations.bottomPipeRack),
        topPipeRack: findClosestData(targetElevations.topPipeRack)
      });

      const findPeakData = (elevation = null) => {
        const filteredPlotData = plotData.filter(elem => (elevation === null || elevation === undefined) || (elevation !== null && elem.z == elevation))
        if (filteredPlotData.length === 0) return null;
        return filteredPlotData
                .reduce((prev, curr) => (curr.rad_level_w_m2 > prev.rad_level_w_m2) ? curr : prev);
      };

      const sortedData = plotData.map((curr) => {
        return {
          dist: Math.sqrt(curr.x**2 + curr.y**2 + curr.z**2),
          rad_level_w_m2: curr.rad_level_w_m2
        };
      }).sort((a, b) => a.dist - b.dist);
      
      setProfileData(sortedData);

      setPeakRadiationData({
        groundLevel: findPeakData(0),
        overall: findPeakData()
      })

    }
  }, [plotData]);

  /**
   * Handle form input changes
   * @param {Event} e - Input change event
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: parseFloat(value) || 0
    });
  };

  const handleFileUpload = (e) => {
    setFile(e.target.files[0]);
  };

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          setProcessData(data);
        } catch (error) {
          console.error('Error parsing JSON:', error);
          setError('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    }
  }, [file])

  useEffect(() => {
    if (file) {
      setCaseNum(prev => prev + 1);
    }
  }, [processData]);

  useEffect(() => {
    if (!useCache) return;
    if (file) {
      setCache({
        json_file_name : file.name,
        case_num : caseNum
      })
    }
  },[caseNum]);

  useEffect(() => {
  }, [cache])

  /**
   * Submit form data to API
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setPlotData([]);
    
    try {
      const response = await fetch(`${apiUrl}/api/radiation_analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          coordsAndMet: formData,
          py_lopa_inputs: processData,
          cache: cache,
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      setPlotData(data.rad_data);
      // 'exit_material': vlc.exit_material,
      // 'discharge_records': vlc.discharge_records,
      // 'discharge_result': vlc.discharge_result,


    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'An error occurred during analysis');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Reset form to default values
   */
  const handleReset = () => {
    setFormData(formDataDefault);
    setPlotData([]);
    setError(null);
    setCriticalData({
      groundLevel: null,
      bottomPipeRack: null,
      topPipeRack: null
    });
    setPeakRadiationData({
      groundLevel: null,
      overall: null
    });
    setCache({});
    setFile(null);
  };

  /**
   * Calculate distance between start and end points
   * @returns {string} Distance in feet, formatted with 2 decimal places
   */
  const calculateDistance = () => {
    const dx = formData.xTransectFinal - formData.xTransectStart;
    const dy = formData.yTransectFinal - formData.yTransectStart;
    const dz = formData.zTransectFinal - formData.zTransectStart;
    return Math.sqrt(dx*dx + dy*dy + dz*dz).toFixed(2);
  };

  /**
   * Format radiation level for display
   * @param {number} value - Radiation level in W/m²
   * @returns {string} Formatted radiation level
   */
  const formatRadiationLevel = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return value.toFixed(2) + ' W/m²';
  };

  return (
    <div className="rad-container">
      <header className="rad-header">
        <h1 className="rad-title">Radiation Analysis</h1>
      </header>
      
      <div className="rad-content">
        {/* Left side - Visualization area */}
        <div className="rad-visualization">
          
          {/* Critical Results Section */}
          {showCriticalData && plotData.length > 0 && !isLoading (
            <div className="rad-critical-results">
              <h2>Critical Locations Analysis</h2>
              <div className="rad-results-grid">
                <div className="rad-result-item">
                  <div className="rad-result-location">Ground Level</div>
                  <div className="rad-result-value">
                    {criticalData.groundLevel ? (
                      <span className={`rad-radiation-level ${getRiskClass(criticalData.groundLevel.rad_level_w_m2)}`}>
                        {formatRadiationLevel(criticalData.groundLevel.rad_level_w_m2)}
                      </span>
                    ) : 'N/A'}
                  </div>
                  <div className="rad-result-elevation">
                    Elevation: {criticalData.groundLevel ? (criticalData.groundLevel.z * 3.28084).toFixed(1) : 0} ft
                  </div>
                </div>
                
                <div className="rad-result-item">
                  <div className="rad-result-location">Bottom of Pipe Rack</div>
                  <div className="rad-result-value">
                    {criticalData.bottomPipeRack ? (
                      <span className={`rad-radiation-level ${getRiskClass(criticalData.bottomPipeRack.rad_level_w_m2)}`}>
                        {formatRadiationLevel(criticalData.bottomPipeRack.rad_level_w_m2)}
                      </span>
                    ) : 'N/A'}
                  </div>
                  <div className="rad-result-elevation">
                    Elevation: 23.0 ft
                  </div>
                </div>
                
                <div className="rad-result-item">
                  <div className="rad-result-location">Top of Pipe Rack</div>
                  <div className="rad-result-value">
                    {criticalData.topPipeRack ? (
                      <span className={`rad-radiation-level ${getRiskClass(criticalData.topPipeRack.rad_level_w_m2)}`}>
                        {formatRadiationLevel(criticalData.topPipeRack.rad_level_w_m2)}
                      </span>
                    ) : 'N/A'}
                  </div>
                  <div className="rad-result-elevation">
                    Elevation: 42.0 ft
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Peak Radiation Results Section */}
          {showPeakRadiationData && peakRadiationData.overall && !isLoading && (
            <div className="rad-critical-results">
              <h2>Peak Radiation Locations</h2>
              <div className="rad-results-grid">
                {peakRadiationData.groundLevel ? (
                  <div>
                    <div className="rad-result-item">
                      <div className="rad-result-location">Ground Level</div>
                      <div className="rad-result-value">
                          <span className={`rad-radiation-level ${getRiskClass(peakRadiationData.groundLevel.rad_level_w_m2)}`}>
                            {formatRadiationLevel(peakRadiationData.groundLevel.rad_level_w_m2)}
                          </span>
                      </div>
                      <div className="rad-result-elevation">
                        Elevation: {peakRadiationData.groundLevel ? (peakRadiationData.groundLevel.z * 3.28084).toFixed(1) : 0} ft
                      </div>
                      <div className="rad-result-elevation">
                        Downwind Distance: {peakRadiationData.groundLevel ? (peakRadiationData.groundLevel.x * 3.28084).toFixed(1) : 0} ft
                      </div>
                      <div className="rad-result-elevation">
                        Crosswind Distance: {peakRadiationData.groundLevel ? (peakRadiationData.groundLevel.y * 3.28084).toFixed(1) : 0} ft
                      </div>
                    </div>
                  </div>
                ) : ''}
                    
                    <div className="rad-result-item">
                      <div className="rad-result-location">Overall</div>
                      <div className="rad-result-value">
                        <span className={`rad-radiation-level ${peakRadiationData.overall.rad_level_w_m2 ? getRiskClass(peakRadiationData.overall.rad_level_w_m2) : ""}`}>
                          {formatRadiationLevel(peakRadiationData.overall.rad_level_w_m2)}
                        </span>
                      </div>
                      <div className="rad-result-elevation">
                        Elevation: {peakRadiationData.overall ? (peakRadiationData.overall.z * 3.28084).toFixed(1) : 0} ft
                      </div>
                      <div className="rad-result-elevation">
                        Downind Distance: {peakRadiationData.overall ? (peakRadiationData.overall.x * 3.28084).toFixed(1) : 0} ft
                      </div>
                      <div className="rad-result-elevation">
                        Crosswind Distance: {peakRadiationData.overall ? (peakRadiationData.overall.y * 3.28084).toFixed(1) : 0} ft
                      </div>
                    </div>
                  
              </div>
            </div>
          )}
          
          <div className="rad-plot-container">
            {isLoading ? (
              <div className="rad-loading">Processing analysis</div>
            ) : error ? (
              <div className="rad-placeholder">
                <p>Error: {error}</p>
                <p>Please try again or check your connection</p>
              </div>
            ) : plotData.length > 0 ? (
              <>
                <button onClick={handleOpenModal}>Pop Out</button>
                <PlotlyViewer data={plotData} />
                <Modal isOpen={isModalOpen} onClose={handleCloseModal} data={plotData} />
              </>
            ) : (
              <div className="rad-placeholder">
                <p>Enter parameters and submit to view radiation analysis</p>
              </div>
            )}
          </div>

          <div className="rad-plot-container">
            {isLoading ? (
              <div className="rad-loading">Processing analysis</div>
            ) : error ? (
              <div className="rad-placeholder">
                <p>Error: {error}</p>
                <p>Please try again or check your connection</p>
              </div>
            ) : profileData.length > 0 ? (
              <>
                <PlotlyProfileViewer data={profileData} />
              </>
            ) : (
              <div className="rad-placeholder">
                <p>Enter parameters and submit to view radiation analysis</p>
              </div>
            )}
          </div>

          {plotData.length > 0 && !isLoading && (
            <div className="rad-summary">
              <h2>Analysis Summary</h2>
              <table className="rad-summary-table">
                <tbody>
                  <tr>
                    <td>Flare Position:</td>
                    <td>({formData.xFlare}, {formData.yFlare}, {formData.zFlare}) ft</td>
                  </tr>
                  <tr>
                    <td>Analysis Path:</td>
                    <td>From ({formData.xTransectStart}, {formData.yTransectStart}, {formData.zTransectStart}) ft to 
                    ({formData.xTransectFinal}, {formData.yTransectFinal}, {formData.zTransectFinal}) ft</td>
                  </tr>
                  <tr>
                    <td>Path Length:</td>
                    <td>{calculateDistance()} ft</td>
                  </tr>
                  <tr>
                    <td>Data Points:</td>
                    <td>{plotData.length}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          
          <div className="rad-imagery">
            <h2>Area Imagery</h2>
            <div className="rad-image-container">
              <img src="data/area_image.png" alt="Area Imagery" />
            </div>
          </div>
        </div>
        
        {/* Right side - Parameters */}
        <div className="rad-parameters">
          <div className="rad-button-group">
            <div className="rad-parameter-section">
              <h2>Load JSON File</h2>
              <div className="rad-input-group">
                <label htmlFor="jsonFile">Upload JSON File:</label>
                <input 
                  id="jsonFile"
                  type="file" 
                  accept=".json" 
                  onChange={handleFileUpload} 
                />
              </div>
              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={useCache}
                    onChange={handleUseCacheCheckboxChange}
                  />
                  Use cached data
                </label>
              </div>
              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={showPeakRadiationData}
                    onChange={handleShowPeakRadiationDataCheckboxChange}
                  />
                  Show Peak Radiation Data
                </label>
              </div>
              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={showCriticalData}
                    onChange={handleShowCriticalDataCheckboxChange}
                  />
                  Show Critical Point Data
                </label>
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="rad-form">
            <div className="rad-button-group">
              <button 
                type="submit" 
                className="rad-button rad-button-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Run Analysis'}
              </button>
              <button 
                type="button" 
                className="rad-button rad-button-secondary"
                onClick={handleReset}
                disabled={isLoading}
              >
                Reset
              </button>
            </div>
            <div className="rad-parameter-section">
            <h2>Met Conditions</h2>
              <div className="rad-input-group">
                <label htmlFor="xFlare">Wind Speed (mph):</label>
                <input 
                  id="windSpeedMph"
                  type="number" 
                  name="windSpeedMph" 
                  value={formData.windSpeedMph} 
                  onChange={handleChange} 
                  step="0.1"
                  required 
                />
              </div>
              <h2>Flare Position</h2>
              <div className="rad-input-group">
                <label htmlFor="xFlare">X Distance (ft):</label>
                <input 
                  id="xFlare"
                  type="number" 
                  name="xFlare" 
                  value={formData.xFlare} 
                  onChange={handleChange} 
                  step="0.1"
                  required 
                />
              </div>
              <div className="rad-input-group">
                <label htmlFor="yFlare">Y Distance (ft):</label>
                <input 
                  id="yFlare"
                  type="number" 
                  name="yFlare" 
                  value={formData.yFlare} 
                  onChange={handleChange}
                  step="0.1" 
                  required 
                />
              </div>
              <div className="rad-input-group">
                <label htmlFor="zFlare">Z Distance (ft):</label>
                <input 
                  id="zFlare"
                  type="number" 
                  name="zFlare" 
                  value={formData.zFlare} 
                  onChange={handleChange}
                  step="0.1" 
                  required 
                />
              </div>
            </div>

            <div className="rad-parameter-section">
              <h2>Starting Point</h2>
              <div className="rad-input-group">
                <label htmlFor="xTransectStart">X Distance (ft):</label>
                <input 
                  id="xTransectStart"
                  type="number" 
                  name="xTransectStart" 
                  value={formData.xTransectStart} 
                  onChange={handleChange}
                  step="0.1" 
                  required 
                />
              </div>
              <div className="rad-input-group">
                <label htmlFor="yTransectStart">Y Distance (ft):</label>
                <input 
                  id="yTransectStart"
                  type="number" 
                  name="yTransectStart" 
                  value={formData.yTransectStart} 
                  onChange={handleChange}
                  step="0.1" 
                  required 
                />
              </div>
              <div className="rad-input-group">
                <label htmlFor="zTransectStart">Z Distance (ft):</label>
                <input 
                  id="zTransectStart"
                  type="number" 
                  name="zTransectStart" 
                  value={formData.zTransectStart} 
                  onChange={handleChange}
                  step="0.1" 
                  required 
                />
              </div>
            </div>

            <div className="rad-parameter-section">
              <h2>Ending Point</h2>
              <div className="rad-input-group">
                <label htmlFor="xTransectFinal">X Distance (ft):</label>
                <input 
                  id="xTransectFinal"
                  type="number" 
                  name="xTransectFinal" 
                  value={formData.xTransectFinal} 
                  onChange={handleChange}
                  step="0.1" 
                  required 
                />
              </div>
              <div className="rad-input-group">
                <label htmlFor="yTransectFinal">Y Distance (ft):</label>
                <input 
                  id="yTransectFinal"
                  type="number" 
                  name="yTransectFinal" 
                  value={formData.yTransectFinal} 
                  onChange={handleChange}
                  step="0.1" 
                  required 
                />
              </div>
              <div className="rad-input-group">
                <label htmlFor="zTransectFinal">Z Distance (ft):</label>
                <input 
                  id="zTransectFinal"
                  type="number" 
                  name="zTransectFinal" 
                  value={formData.zTransectFinal} 
                  onChange={handleChange}
                  step="0.1" 
                  required 
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

/**
 * Helper function to determine risk class based on radiation level
 * @param {number} level - Radiation level in W/m²
 * @returns {string} CSS class name for risk level
 */
function getRiskClass(level) {
  if (level === null || level === undefined) return '';
  if (level < 1.58) return 'rad-risk-low';
  if (level < 4.73) return 'rad-risk-medium';
  if (level < 6.31) return 'rad-risk-high';
  return 'rad-risk-critical';
}

export default RadiationAnalysis;