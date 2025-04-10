import React, { useState, useEffect } from 'react';
import L from 'leaflet';
import ConfirmationPopup from '../ui/ConfirmationPopup';
import { getApiUrl, createFlammableExtentCircle } from '../../utils/mapUtils';

const FlammableExtentTool = ({ 
  jsonData, 
  currentReleaseLocation, 
  mapState, 
  updateGuidanceBanner,
  onFlammableExtentData 
}) => {
  const { mapRef, mapLoaded, releaseMarkerRef, flammableExtentCircleRef } = mapState;
  
  const [isFlammableExtentLoading, setIsFlammableExtentLoading] = useState(false);
  const [flammableExtentError, setFlammableExtentError] = useState('');
  const [showModelConfirmation, setShowModelConfirmation] = useState(false);
  const [showFlammableExtent, setShowFlammableExtent] = useState(false);
  const [maxDownwindExtent, setMaxDownwindExtent] = useState('');

  // Now using getApiUrl from mapUtils

  // Effect to show model confirmation when component mounts if no data exists
  useEffect(() => {
    if (!isFlammableExtentLoading && !showFlammableExtent) {
      setShowModelConfirmation(true);
    }
  }, [isFlammableExtentLoading, showFlammableExtent]);

  // Effect to handle confirmation popup escape key
  useEffect(() => {
    if (showModelConfirmation) {
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          setShowModelConfirmation(false);
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [showModelConfirmation]);
  
  // Function to fetch flammable extent data
  const fetchFlammableExtent = async () => {
    if (!jsonData) return;
    
    setIsFlammableExtentLoading(true);
    setFlammableExtentError('');
    setShowModelConfirmation(false);
    
    // Show loading banner
    updateGuidanceBanner('Calculating flammable envelope. This may take up to two minutes to complete.');
    
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/vce_get_flammable_envelope`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData)
      });
      
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      
      const data = await response.json();
      
      updateGuidanceBanner('');

      if (data.error) {
        updateGuidanceBanner("Error returned from flammable mass calculation: ", data.error);
      }

      if (data.flam_env_data) {
        onFlammableExtentData(data.flam_env_data);
        setShowFlammableExtent(true);
        setMaxDownwindExtent(data.flam_env_data.maximum_downwind_extent);
      } else {
        updateGuidanceBanner("Flammabe envelope data not calculated properly.");
      }
      
      
      // Clear guidance banner
      updateGuidanceBanner('');
    } catch (error) {
      console.error('Error fetching flammable extent:', error);
      setFlammableExtentError(`Failed to fetch flammable extent: ${error.message}`);
      updateGuidanceBanner('');
    } finally {
      setIsFlammableExtentLoading(false);
    }
  };

  // If no JSON data is loaded, show message
  if (!jsonData) {
    return <p>Please load a JSON file first to calculate flammable envelope.</p>;
  }

  return (
    <div className="flammable-extent-info">
      {maxDownwindExtent ? (
        <div className="extent-results">
          <p>Flammable envelope calculated successfully.</p>
          <p>Maximum downwind extent: {
              maxDownwindExtent === 0 
                ? "No flammable extent detected" 
                : (parseFloat(maxDownwindExtent).toFixed(2) || "Unknown")
                  + " meters."
                  + " The red hatched circle on the map represents the maximum extent of the flammable envelope."
              }
          </p>
          
          {!showFlammableExtent && (
            <button 
              className="calculate-button" 
              onClick={() => setShowFlammableExtent(true)}
            >
              Show Flammable Envelope
            </button>
          )}
        </div>
      ) : isFlammableExtentLoading ? (
        <div className="loading-indicator">
          <p>Calculating flammable envelope...</p>
          <p>This process may take up to two minutes to complete.</p>
          <div className="spinner"></div>
        </div>
      ) : flammableExtentError ? (
        <div className="error-message">
          <p>{flammableExtentError}</p>
          <button 
            className="retry-button" 
            onClick={() => setShowModelConfirmation(true)}
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="start-calculation">
          <p>Click the button below to calculate the flammable envelope for this release scenario.</p>
          <button 
            className="calculate-button" 
            onClick={() => setShowModelConfirmation(true)}
          >
            Calculate Flammable Envelope
          </button>
        </div>
      )}
      
      {/* Flammable Extent Legend */}
      {flammableExtentCircleRef.current && showFlammableExtent && (
        <div className="circle-legend-info flammable-legend-info">
          Flammable Extent: {parseFloat(maxDownwindExtent).toFixed(2)}m
        </div>
      )}
      
      {/* Model Confirmation Popup */}
      {showModelConfirmation && (
        <ConfirmationPopup 
          message="This will start the flammable envelope calculation model. This process may take up to two minutes to complete. Do you want to proceed?"
          confirmText="Proceed"
          onConfirm={fetchFlammableExtent}
          onCancel={() => setShowModelConfirmation(false)}
        />
      )}
    </div>
  );
};

export default FlammableExtentTool;