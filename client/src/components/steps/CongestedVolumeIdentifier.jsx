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
  const [congestionLevel, setCongestionLevel] = useState(initialData?.congestionLevel || 'low');
  const [isIndoors, setIsIndoors] = useState(initialData?.isIndoors || false);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content congested-volume-form">
        <h3>{isEditing ? 'Edit' : 'New'} Congested Volume</h3>
        
        <div className="form-group">
          <label className="form-label">Congestion Level:</label>
          <div className="radio-group">
            <label>
              <input 
                type="radio" 
                name="congestionLevel" 
                value="low" 
                checked={congestionLevel === 'low'} 
                onChange={() => setCongestionLevel('low')} 
              />
              Low: Easy to walk through
            </label>
            <label>
              <input 
                type="radio" 
                name="congestionLevel" 
                value="medium" 
                checked={congestionLevel === 'medium'} 
                onChange={() => setCongestionLevel('medium')} 
              />
              Medium: Cumbersome to walk through, often requires an indirect path
            </label>
            <label>
              <input 
                type="radio" 
                name="congestionLevel" 
                value="high" 
                checked={congestionLevel === 'high'} 
                onChange={() => setCongestionLevel('high')} 
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
            onClick={() => onSave({ congestionLevel, isIndoors })}
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
      ...formData
    };
    
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
          {congestedVolumes.map(volume => (
            <div 
              key={volume.id} 
              className="volume-item"
              onClick={() => editVolume(volume.id)}
            >
              <div className="volume-info">
                <span className="volume-id">Volume {volume.id.split('-')[1]}</span>
                <span className={`congestion-level ${volume.congestionLevel}`}>
                  {volume.congestionLevel.charAt(0).toUpperCase() + volume.congestionLevel.slice(1)} Congestion
                </span>
                {volume.isIndoors && <span className="indoors-tag">Indoors</span>}
              </div>
              <div className="volume-distance">
                {volume.distance.toFixed(2)}m
              </div>
            </div>
          ))}
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