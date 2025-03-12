import React, { useState, useEffect } from 'react';

const ReleaseLocationEditor = ({ 
  jsonData, 
  currentReleaseLocation, 
  mapState, 
  updateGuidanceBanner,
  onLocationUpdate 
}) => {
  const { mapRef, mapLoaded, releaseMarkerRef } = mapState;
  const [locationUpdated, setLocationUpdated] = useState(false);
  const [newLocation, setNewLocation] = useState(null);

  // Add drag capability to the release marker when this component is active
  useEffect(() => {
    if (mapLoaded && releaseMarkerRef.current) {
      // Enable dragging
      releaseMarkerRef.current.dragging.enable();
      
      // Show guidance banner
      updateGuidanceBanner('Drag and drop the release point to the correct location. Click "Done" when complete.');
      
      // Add drag event handler
      const handleDragEnd = function(event) {
        const marker = event.target;
        const position = marker.getLatLng();
        setNewLocation({
          lat: position.lat.toFixed(6),
          lng: position.lng.toFixed(6)
        });
        setLocationUpdated(true);
      };
      
      releaseMarkerRef.current.on('dragend', handleDragEnd);
      
      // Clean up on unmount or when component becomes inactive
      return () => {
        if (releaseMarkerRef.current) {
          releaseMarkerRef.current.dragging.disable();
          releaseMarkerRef.current.off('dragend', handleDragEnd);
        }
        updateGuidanceBanner('');
      };
    }
  }, [mapLoaded, releaseMarkerRef, updateGuidanceBanner]);

  // Update release location in the JSON data
  const updateReleaseLocation = () => {
    if (!locationUpdated || !newLocation) {
      alert('No changes have been made to the release location.');
      return;
    }
    
    if (jsonData) {
      // Create a new JSON data object with updated coordinates
      const updatedJsonData = {
        ...jsonData,
        PrimaryInputs: {
          ...jsonData.PrimaryInputs,
          ApproxLatitude: parseFloat(newLocation.lat),
          ApproxLongitude: parseFloat(newLocation.lng)
        }
      };
      
      onLocationUpdate(updatedJsonData);
      setLocationUpdated(false);
      alert('Release location has been updated successfully!');
    }
  };

  // If no JSON data is loaded, show message
  if (!jsonData) {
    return <p>Please load a JSON file first to verify release location.</p>;
  }

  // Get the location to display (either the new dragged location or the current one)
  const displayLocation = newLocation || currentReleaseLocation;

  return (
    <div className="location-info">
      <p>Current release coordinates:</p>
      <div className="coordinates">
        {displayLocation ? (
          <>
            Latitude: {displayLocation.lat}<br />
            Longitude: {displayLocation.lng}
          </>
        ) : (
          'Location data not available'
        )}
      </div>
      
      {locationUpdated && (
        <p className="location-changed">
          Location has been changed. Click "Done" to update.
        </p>
      )}
      
      <p>Drag the marker on the map to adjust the release point location.</p>
      
      <button 
        className="done-button" 
        onClick={updateReleaseLocation}
        disabled={false}
      >
        Done
      </button>
    </div>
  );
};

export default ReleaseLocationEditor;