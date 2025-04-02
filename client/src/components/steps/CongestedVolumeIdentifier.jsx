import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import ConfirmationPopup from '../ui/ConfirmationPopup';
import { createDistanceCircle } from '../../utils/mapUtils';

// Popup form for congested volume details
const CongestedVolumeForm = ({ 
  isOpen, 
  initialData, 
  onSave, 
  onCancel, 
  isEditing = false,
  onDelete 
}) => {
  const [congestionLevel, setCongestionLevel] = useState(initialData?.congestionLevel || '0');
  const [isIndoors, setIsIndoors] = useState(initialData?.isIndoors || false);
  
  // New state for dimensions and elevation
  const [width, setWidth] = useState(initialData?.width || '');
  const [length, setLength] = useState(initialData?.length || '');
  const [height, setHeight] = useState(initialData?.height || '');
  const [elevationAboveGrade, setElevationAboveGrade] = useState(initialData?.elevationAboveGrade || '');

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content congested-volume-form">
        <h3>{isEditing ? 'Edit' : 'New'} Congested Volume</h3>
        
        {/* Existing congestion level section */}
        <div className="form-group">
          <label className="form-label">Congestion Level:</label>
          <div className="radio-group">
            <label>
              <input 
                type="radio" 
                name="congestionLevel" 
                value="low" 
                checked={congestionLevel === 0} 
                onChange={() => setCongestionLevel(0)} 
              />
              Low: Easy to walk through
            </label>
            <label>
              <input 
                type="radio" 
                name="congestionLevel" 
                value="medium" 
                checked={congestionLevel === 1} 
                onChange={() => setCongestionLevel(1)} 
              />
              Medium: Cumbersome to walk through, often requires an indirect path
            </label>
            <label>
              <input 
                type="radio" 
                name="congestionLevel" 
                value="high" 
                checked={congestionLevel === 2} 
                onChange={() => setCongestionLevel(2)} 
              />
              High: Not possible to walk through due to insufficient space
            </label>
          </div>
        </div>
        
        <div className="form-group">
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={isIndoors} 
              onChange={() => setIsIndoors(!isIndoors)} 
            />
            Indoors
          </label>
        </div>
        
        {/* Dimensions input */}
        <div className="form-group">
          <label className="form-label">Volume Dimensions (meters):</label>
          <div className="dimension-inputs">
            <label className="dimension-input-label">
              <input 
                type="number" 
                placeholder="Width" 
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                step="0.1"
                min="0"
              />
              <span>Width</span>
            </label>
            <label className="dimension-input-label">
              <input 
                type="number" 
                placeholder="Length" 
                value={length}
                onChange={(e) => setLength(e.target.value)}
                step="0.1"
                min="0"
              />
              <span>Length</span>
            </label>
            <label className="dimension-input-label">
              <input 
                type="number" 
                placeholder="Height" 
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                step="0.1"
                min="0"
              />
              <span>Height</span>
            </label>
          </div>
        </div>
        
        {/* Elevation input */}
        <div className="form-group">
          <label className="form-label">Elevation Above Grade (meters):</label>
          <label className="dimension-input-label">
            <input 
              type="number" 
              value={elevationAboveGrade}
              onChange={(e) => setElevationAboveGrade(e.target.value)}
              placeholder="Elevation"
              step="0.1"
            />
            <span>Elevation</span>
          </label>
        </div>
        
        {isEditing && (
          <button 
            className="delete-button" 
            onClick={() => onDelete()} 
          >
            Delete
          </button>
        )}
        
        <div className="form-buttons">
          <button className="cancel-button" onClick={onCancel}>Cancel</button>
          <button 
            className="ok-button" 
            onClick={() => onSave({ 
              congestionLevel, 
              isIndoors,
              width: parseFloat(width),
              length: parseFloat(length),
              height: parseFloat(height),
              elevationAboveGrade: parseFloat(elevationAboveGrade)
            })}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

// Main component for congested volume identification
const CongestedVolumeIdentifier = ({
  jsonData,
  currentReleaseLocation,
  mapState,
  updateGuidanceBanner,
  onCongestedVolumesUpdate
}) => {
  const { mapRef, mapLoaded, releaseMarkerRef } = mapState;
  
  const [congestedVolumes, setCongestedVolumes] = useState([]);
  const [isAddingVolume, setIsAddingVolume] = useState(false);
  const [currentDistance, setCurrentDistance] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [clickPosition, setClickPosition] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [activeVolumeId, setActiveVolumeId] = useState(null);
  const [editingVolume, setEditingVolume] = useState(null);
  
  // Mouse move handler to track distance
  useEffect(() => {
    if (isAddingVolume && mapLoaded && mapRef.current && currentReleaseLocation) {
      updateGuidanceBanner(`Distance from release source to congested volume: ${currentDistance ? currentDistance.toFixed(2) : '0.00'} meters`);
      
      const handleMouseMove = (e) => {
        const releasePoint = L.latLng(
          parseFloat(currentReleaseLocation.lat), 
          parseFloat(currentReleaseLocation.lng)
        );
        const distance = releasePoint.distanceTo(e.latlng);
        setCurrentDistance(distance);
      };
      
      mapRef.current.on('mousemove', handleMouseMove);
      
      // Handle click to place volume
      const handleMapClick = (e) => {
        setClickPosition(e.latlng);
        setShowConfirmation(true);
      };
      
      mapRef.current.on('click', handleMapClick);
      
      return () => {
        mapRef.current.off('mousemove', handleMouseMove);
        mapRef.current.off('click', handleMapClick);
        updateGuidanceBanner('');
      };
    }
  }, [isAddingVolume, mapLoaded, mapRef, currentReleaseLocation, currentDistance, updateGuidanceBanner]);
  
  // Function to start adding a new congested volume
  const startAddingVolume = () => {
    setIsAddingVolume(true);
  };
  
  // Function to confirm placement
  const confirmPlacement = () => {
    setShowConfirmation(false);
    setShowForm(true);
  };
  
  // Function to cancel placement
  const cancelPlacement = () => {
    setShowConfirmation(false);
    setClickPosition(null);
    setIsAddingVolume(false);
  };
  
  // Function to save congested volume data
  const saveVolumeData = (formData) => {
    if (!clickPosition) return;
    
    const newVolume = {
      id: activeVolumeId || `volume-${Date.now()}`,
      position: {
        lat: clickPosition.lat,
        lng: clickPosition.lng
      },
      distance: currentDistance,
      ...formData,
      flammableMassG: null  // Initialize flammable mass as null
    };

    console.log("xxx new volume created: ", newVolume);

    if (activeVolumeId) {
      // Update existing volume
      const updatedVolumes = congestedVolumes.map(vol => 
        vol.id === activeVolumeId ? newVolume : vol
      );
      setCongestedVolumes(updatedVolumes);
      onCongestedVolumesUpdate(updatedVolumes);
    } else {
      // Add new volume
      const updatedVolumes = [...congestedVolumes, newVolume];
      setCongestedVolumes(updatedVolumes);
      onCongestedVolumesUpdate(updatedVolumes);
    }
    
    setShowForm(false);
    setClickPosition(null);
    setIsAddingVolume(false);
    setActiveVolumeId(null);
    setEditingVolume(null);
  };
  
  // Function to cancel form
  const cancelForm = () => {
    setShowForm(false);
    setClickPosition(null);
    setIsAddingVolume(false);
    setActiveVolumeId(null);
    setEditingVolume(null);
  };
  
  // Function to edit a volume
  const editVolume = (volumeId) => {
    const volume = congestedVolumes.find(v => v.id === volumeId);
    if (volume) {
      setActiveVolumeId(volumeId);
      setEditingVolume(volume);
      setClickPosition(L.latLng(volume.position.lat, volume.position.lng));
      setShowForm(true);
    }
  };
  
  // Function to delete a volume
  const deleteVolume = (volumeId) => {
    const updatedVolumes = congestedVolumes.filter(v => v.id !== volumeId);
    setCongestedVolumes(updatedVolumes);
    onCongestedVolumesUpdate(updatedVolumes);
    setShowForm(false);
    setActiveVolumeId(null);
    setEditingVolume(null);
  };
  
  if (!jsonData) {
    return <p>Please load a JSON file first to identify congested volumes.</p>;
  }
  
  return (
    <div className="congested-volume-container">
      <button 
        className="add-volume-button" 
        onClick={startAddingVolume}
      >
        Add New Congested Volume
      </button>
      
      {congestedVolumes.length > 0 && (
        <div className="volume-list">
          <h4>Congested Volumes:</h4>
          {congestedVolumes.map(volume => {
            // Calculate total volume in cubic meters
            const volumeM3 = volume.width && volume.length && volume.height 
              ? (volume.width * volume.length * volume.height).toFixed(2) 
              : 'N/A';

            return (
              <div 
                key={volume.id} 
                className="volume-item"
                onClick={() => editVolume(volume.id)}
              >
                <div className="volume-info">
                  <span className="volume-label">Volume {volumeM3} m³</span>
                  <span className={`congestion-level ${volume.congestionLevel === 0 ? 'low' : volume.congestionLevel === 1 ? 'medium' : 'high'}`}>
                    {volume.congestionLevel === 0 ? 'Low' : volume.congestionLevel === 1 ? 'Medium' : 'High'} Congestion
                  </span>
                  {volume.isIndoors && <span className="indoors-tag">Indoors or Between Concrete Deck Floors</span>}
                </div>
                <div className="volume-distance">
                  {volume.distance.toFixed(2)}m
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Confirmation popup */}
      {showConfirmation && (
        <ConfirmationPopup 
          message="Do you want to place a congested volume at this location?"
          onConfirm={confirmPlacement}
          onCancel={cancelPlacement}
        />
      )}
      
      {/* Congested volume form */}
      {showForm && (
        <CongestedVolumeForm 
          isOpen={showForm}
          initialData={editingVolume}
          isEditing={!!editingVolume}
          onSave={saveVolumeData}
          onCancel={cancelForm}
          onDelete={() => deleteVolume(activeVolumeId)}
        />
      )}
    </div>
  );
};

export default CongestedVolumeIdentifier;