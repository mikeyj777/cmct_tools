import React, { useState, useEffect } from 'react';
import L from 'leaflet';
import ConfirmationPopup from '../ui/ConfirmationPopup';
import { getOccupancyClass, createDistanceCircle } from '../../utils/mapUtils';

const BuildingPlacementTool = ({ 
  jsonData, 
  buildings, 
  currentReleaseLocation, 
  mapState, 
  updateGuidanceBanner,
  getOccupancyText,
  getBuildingIcon,
  onBuildingsUpdate 
}) => {
  const { mapRef, mapLoaded, circleRef, buildingMarkersRef } = mapState;
  
  const [currentBuildingIndex, setCurrentBuildingIndex] = useState(0);
  const [isInitialPlacement, setIsInitialPlacement] = useState(true);
  const [activeBuildingId, setActiveBuildingId] = useState(null);
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
  const [tempBuildingPosition, setTempBuildingPosition] = useState(null);
  
  // Initialize building placement workflow
  useEffect(() => {
    if (mapLoaded && buildings.length > 0 && currentReleaseLocation) {
      // If we're in initial placement mode and have buildings left to place
      if (isInitialPlacement) {
        startBuildingPlacement(currentBuildingIndex);
      }
    }
    
    // Clean up on unmount
    return () => {
      if (mapRef.current && circleRef.current) {
        mapRef.current.removeLayer(circleRef.current);
        circleRef.current = null;
      }
      updateGuidanceBanner('');
    };
  }, [mapLoaded, buildings, currentReleaseLocation, isInitialPlacement, currentBuildingIndex, mapRef, circleRef, updateGuidanceBanner]);
  
  // Effect to handle confirmation popup escape key
  useEffect(() => {
    if (showConfirmationPopup) {
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          cancelBuildingPlacement();
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [showConfirmationPopup]);

  // Start the building placement process for a given index
  const startBuildingPlacement = (index) => {
    if (!buildings[index] || !mapRef.current || !currentReleaseLocation) return;
    
    const currentBuilding = buildings[index];
    setActiveBuildingId(currentBuilding.NearbyBuildingID);
    
    // Clear any existing circle
    if (circleRef.current) {
      mapRef.current.removeLayer(circleRef.current);
      circleRef.current = null;
    }
    
    // Draw a circle representing the distance from release point using utility function
    const releasePoint = [parseFloat(currentReleaseLocation.lat), parseFloat(currentReleaseLocation.lng)];
    circleRef.current = createDistanceCircle(
      mapRef.current, 
      releasePoint, 
      currentBuilding.DistanceFromRelease
    );
    
    // Update guidance banner
    updateGuidanceBanner(
      `The circle shows the distance to building ${currentBuilding.BuildingNumber || `#${index + 1}`}. 
      Click anywhere on the circle to place the building marker at its approximate location.`,
      'building'
    );
    
    // Add click handler to map for building placement
    mapRef.current.once('click', function(e) {
      const position = e.latlng;
      setTempBuildingPosition(position);
      setShowConfirmationPopup(true);
    });
  };

  // Function to confirm building placement
  const confirmBuildingPlacement = () => {
    if (!tempBuildingPosition) return;
    
    // Update the building data with the new location
    const updatedBuildings = [...buildings];
    const currentBuilding = {...updatedBuildings[currentBuildingIndex]};
    
    currentBuilding.location = {
      lat: tempBuildingPosition.lat,
      lng: tempBuildingPosition.lng
    };
    currentBuilding.confirmed = true;
    
    updatedBuildings[currentBuildingIndex] = currentBuilding;
    onBuildingsUpdate(updatedBuildings);
    
    // Add or update the building marker on the map
    if (buildingMarkersRef.current[currentBuilding.NearbyBuildingID]) {
      buildingMarkersRef.current[currentBuilding.NearbyBuildingID].setLatLng([
        tempBuildingPosition.lat,
        tempBuildingPosition.lng
      ]);
    } else {
      // Get the appropriate icon based on occupancy level
      const buildingMarker = L.marker([tempBuildingPosition.lat, tempBuildingPosition.lng], {
        icon: getBuildingIcon(currentBuilding.OccupancyLevel),
        draggable: true
      })
        .addTo(mapRef.current)
        .bindPopup(`${currentBuilding.BuildingNumber || 'Building'} - ${getOccupancyText(currentBuilding.OccupancyLevel)}`);
        
      buildingMarker.on('dragend', function(event) {
        const marker = event.target;
        const position = marker.getLatLng();
        
        // Update the building location in the state
        const updatedBuildings = [...buildings];
        const buildingIndex = updatedBuildings.findIndex(b => b.NearbyBuildingID === currentBuilding.NearbyBuildingID);
        
        if (buildingIndex !== -1) {
          updatedBuildings[buildingIndex] = {
            ...updatedBuildings[buildingIndex],
            location: {
              lat: position.lat,
              lng: position.lng
            }
          };
          onBuildingsUpdate(updatedBuildings);
        }
      });
      
      buildingMarkersRef.current[currentBuilding.NearbyBuildingID] = buildingMarker;
    }
    
    // Close confirmation popup
    setShowConfirmationPopup(false);
    setTempBuildingPosition(null);
    
    // If in initial placement mode, move to the next building
    if (isInitialPlacement) {
      if (currentBuildingIndex < buildings.length - 1) {
        setCurrentBuildingIndex(currentBuildingIndex + 1);
        // Start placement for the next building
        setTimeout(() => {
          startBuildingPlacement(currentBuildingIndex + 1);
        }, 100);
      } else {
        // All buildings placed, exit initial placement mode
        setIsInitialPlacement(false);
        if (circleRef.current) {
          mapRef.current.removeLayer(circleRef.current);
          circleRef.current = null;
        }
        updateGuidanceBanner('');
      }
    }
  };

  // Function to cancel building placement
  const cancelBuildingPlacement = () => {
    setShowConfirmationPopup(false);
    setTempBuildingPosition(null);
  };

  // Function to select a building for editing
  const selectBuilding = (buildingId) => {
    setIsInitialPlacement(false);
    setActiveBuildingId(buildingId);
    
    // Clean up any existing circle
    if (circleRef.current) {
      mapRef.current.removeLayer(circleRef.current);
      circleRef.current = null;
    }
    
    // Find the building in the state
    const buildingIndex = buildings.findIndex(b => b.NearbyBuildingID === buildingId);
    
    if (buildingIndex !== -1) {
      const building = buildings[buildingIndex];
      setCurrentBuildingIndex(buildingIndex);
      
      // If the building has a location, center the map on it
      if (building.location) {
        mapRef.current.setView([building.location.lat, building.location.lng], 15);
        
        // If the building already has a marker and we want to edit it
        if (buildingMarkersRef.current[buildingId]) {
          updateGuidanceBanner(`Editing ${building.BuildingNumber || 'Building'}. You can drag the marker to adjust its location.`);
          
          // Ensure the marker is draggable
          buildingMarkersRef.current[buildingId].dragging.enable();
        }
      } else {
        // If building doesn't have a location yet, start the placement process
        startBuildingPlacement(buildingIndex);
      }
    }
  };
  
  // If no JSON data is loaded, show message
  if (!jsonData) {
    return <p>Please load a JSON file first to identify building locations.</p>;
  }
  
  // If no buildings found in data
  if (buildings.length === 0) {
    return <p>No building information found in the loaded JSON file.</p>;
  }

  return (
    <div>
      {isInitialPlacement && (
        <div className="building-info">
          <p>Locating building {currentBuildingIndex + 1} of {buildings.length}:</p>
          <p>
            <strong>
              {buildings[currentBuildingIndex]?.BuildingNumber || 'Building'} - 
              <span className={`occupancy-indicator ${getOccupancyClass(buildings[currentBuildingIndex]?.OccupancyLevel)}`}>
                {getOccupancyText(buildings[currentBuildingIndex]?.OccupancyLevel)}
              </span>
            </strong>
          </p>
          <p>Distance from release: {buildings[currentBuildingIndex]?.DistanceFromRelease}m</p>
        </div>
      )}
      
      <div className="buildings-list">
        {buildings.map((building, index) => (
          <div 
            key={building.NearbyBuildingID}
            className={`building-item ${activeBuildingId === building.NearbyBuildingID ? 'active' : ''}`}
            onClick={() => selectBuilding(building.NearbyBuildingID)}
          >
            <div>
              <span>{building.BuildingNumber || `Building ${index + 1}`}</span>
              <span className={`occupancy-indicator ${getOccupancyClass(building.OccupancyLevel)}`}>
                {getOccupancyText(building.OccupancyLevel)}
              </span>
            </div>
            <div className="status-indicator">
              {building.confirmed && (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="green" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Circle distance legend if visible */}
      {circleRef.current && (
        <div className="circle-legend-info">
          Distance: {buildings[currentBuildingIndex]?.DistanceFromRelease}m
        </div>
      )}
      
      {/* Building Confirmation Popup */}
      {showConfirmationPopup && (
        <ConfirmationPopup 
          message={`Confirm building location for ${buildings[currentBuildingIndex]?.BuildingNumber || `Building #${currentBuildingIndex + 1}`}?`}
          onConfirm={confirmBuildingPlacement}
          onCancel={cancelBuildingPlacement}
        />
      )}
    </div>
  );
};

export default BuildingPlacementTool;