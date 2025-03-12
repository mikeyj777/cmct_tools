import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import FileImport from './FileImport';

// Default leaflet marker icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create a custom marker icon for the release point
const releaseIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Create functions to get marker icons based on occupancy level
const getBuildingIcon = (occupancyLevel) => {
  // Define icon URLs for different occupancy levels
  const iconUrls = {
    0: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', // Low - green
    1: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png', // Medium - yellow
    2: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', // High - red
    default: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png' // Default - blue
  };

  return L.icon({
    iconUrl: iconUrls[occupancyLevel] || iconUrls.default,
    iconRetinaUrl: iconUrls[occupancyLevel] || iconUrls.default,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const LeafletMap = () => {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markerRef = useRef(null);
  const releaseMarkerRef = useRef(null);
  const circleRef = useRef(null);
  const buildingMarkersRef = useRef({});
  
  const [searchQuery, setSearchQuery] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activeLayer, setActiveLayer] = useState('aerial');
  const [searchStatus, setSearchStatus] = useState('');
  const [locationStatus, setLocationStatus] = useState('');
  
  // Analysis state
  const [activeStep, setActiveStep] = useState(0);
  const [jsonFile, setJsonFile] = useState(null);
  const [jsonData, setJsonData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [currentReleaseLocation, setCurrentReleaseLocation] = useState(null);
  const [showGuidanceBanner, setShowGuidanceBanner] = useState(false);
  const [locationUpdated, setLocationUpdated] = useState(false);

  // Building identification state
  const [buildings, setBuildings] = useState([]);
  const [currentBuildingIndex, setCurrentBuildingIndex] = useState(0);
  const [isInitialPlacement, setIsInitialPlacement] = useState(true);
  const [showBuildingGuidance, setShowBuildingGuidance] = useState(false);
  const [activeBuildingId, setActiveBuildingId] = useState(null);
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
  const [tempBuildingPosition, setTempBuildingPosition] = useState(null);

  // State to manage visibility of the FileImport component
  const [showFileImport, setShowFileImport] = useState(false);

  const toggleFileImport = () => {
    setShowFileImport(!showFileImport);
  };

  // Initialize the map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      // Create map
      const map = L.map(mapContainerRef.current).setView([51.505, -0.09], 13);
      
      // Add the default street layer
      const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      });
      
      // Add aerial/satellite layer
      const aerialLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      }).addTo(map);
      
      // Store layers for later toggling
      map.layers = {
        street: streetLayer,
        aerial: aerialLayer
      };
      
      mapRef.current = map;
      setMapLoaded(true);
    }
    
    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Effect to update map when JSON data is loaded
  useEffect(() => {
    if (mapLoaded && jsonData && jsonData.PrimaryInputs) {
      const { ApproxLatitude, ApproxLongitude } = jsonData.PrimaryInputs;
      
      if (ApproxLatitude && ApproxLongitude) {
        // Center map on the release point
        mapRef.current.setView([ApproxLatitude, ApproxLongitude], 15);
        
        // Add or update release marker
        if (releaseMarkerRef.current) {
          releaseMarkerRef.current.setLatLng([ApproxLatitude, ApproxLongitude]);
        } else {
          releaseMarkerRef.current = L.marker([ApproxLatitude, ApproxLongitude], { 
            icon: releaseIcon,
            draggable: activeStep === 1 // Only draggable in step 2
          })
            .addTo(mapRef.current)
            .bindPopup('Release Point')
            .openPopup();
            
          // Add drag event handler
          releaseMarkerRef.current.on('dragend', function(event) {
            const marker = event.target;
            const position = marker.getLatLng();
            setCurrentReleaseLocation({
              lat: position.lat.toFixed(6),
              lng: position.lng.toFixed(6)
            });
            setLocationUpdated(true);
          });
        }
        
        setCurrentReleaseLocation({
          lat: ApproxLatitude.toFixed(6),
          lng: ApproxLongitude.toFixed(6)
        });
      }

      // If BuildingInfo is present, set the buildings state
      if (jsonData.BuildingInfo && jsonData.BuildingInfo.length > 0) {
        const buildingsWithLocation = jsonData.BuildingInfo.map(building => ({
          ...building,
          location: null, // Will be set when user places the building
          confirmed: false
        }));
        setBuildings(buildingsWithLocation);
      }
    }
  }, [mapLoaded, jsonData]);

  // Update marker draggability based on active step
  useEffect(() => {
    if (releaseMarkerRef.current && releaseMarkerRef.current.dragging) {
      if (activeStep === 1) {
        releaseMarkerRef.current.dragging.enable();
        setShowGuidanceBanner(true);
      } else {
        releaseMarkerRef.current.dragging.disable();
        setShowGuidanceBanner(false);
      }
    }
  }, [activeStep]);

  // Effect to handle building identification process
  useEffect(() => {
    if (activeStep === 2 && mapLoaded && buildings.length > 0 && currentReleaseLocation) {
      setShowBuildingGuidance(true);
      
      // If we're in initial placement mode and have a current building
      if (isInitialPlacement && buildings[currentBuildingIndex]) {
        const currentBuilding = buildings[currentBuildingIndex];
        setActiveBuildingId(currentBuilding.NearbyBuildingID);
        
        // Clear any existing circle
        if (circleRef.current) {
          mapRef.current.removeLayer(circleRef.current);
          circleRef.current = null;
        }
        
        // Draw a circle representing the distance from release point
        const releasePoint = [parseFloat(currentReleaseLocation.lat), parseFloat(currentReleaseLocation.lng)];
        circleRef.current = L.circle(releasePoint, {
          radius: currentBuilding.DistanceFromRelease,
          color: '#3388ff',
          weight: 3,
          fillOpacity: 0.05
        }).addTo(mapRef.current);
        
        // Add click handler to map for building placement
        mapRef.current.once('click', function(e) {
          const position = e.latlng;
          setTempBuildingPosition(position);
          setShowConfirmationPopup(true);
        });
      }
    } else {
      setShowBuildingGuidance(false);
      
      // Remove circle if step is not active
      if (circleRef.current) {
        mapRef.current.removeLayer(circleRef.current);
        circleRef.current = null;
      }
    }
  }, [activeStep, currentBuildingIndex, isInitialPlacement, buildings, currentReleaseLocation, mapLoaded]);
  
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

  // Function to toggle between map layers
  const toggleMapLayer = (layerType) => {
    if (!mapLoaded) return;
    
    const map = mapRef.current;
    
    // Remove both layers
    Object.values(map.layers).forEach(layer => {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });
    
    // Add the selected layer
    map.layers[layerType].addTo(map);
    setActiveLayer(layerType);
  };

  // Function to get user's current location
  const getMyLocation = () => {
    if (!mapLoaded) return;
    
    setLocationStatus('Getting your location...');
    
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Center map on user's position
        mapRef.current.setView([latitude, longitude], 15);
        
        // Add or update marker
        if (markerRef.current) {
          markerRef.current.setLatLng([latitude, longitude]);
        } else {
          markerRef.current = L.marker([latitude, longitude])
            .addTo(mapRef.current)
            .bindPopup('Your location')
            .openPopup();
        }
        
        setLocationStatus('Location found!');
        setTimeout(() => setLocationStatus(''), 2000);
      },
      (error) => {
        setLocationStatus(`Unable to retrieve your location: ${error.message}`);
        setTimeout(() => setLocationStatus(''), 5000);
      }
    );
  };

  // Function to search for a location
  const searchLocation = async (e) => {
    e.preventDefault();
    
    if (!mapLoaded || !searchQuery.trim()) return;
    
    setSearchStatus('Searching...');
    
    try {
      // Use Nominatim for geocoding (OpenStreetMap's geocoding service)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      
      if (data.length === 0) {
        setSearchStatus('No results found');
        setTimeout(() => setSearchStatus(''), 3000);
        return;
      }
      
      // Get first result
      const { lat, lon, display_name } = data[0];
      
      // Center map on result
      mapRef.current.setView([lat, lon], 15);
      
      // Add or update marker
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lon])
          .setPopupContent(display_name)
          .openPopup();
      } else {
        markerRef.current = L.marker([lat, lon])
          .addTo(mapRef.current)
          .bindPopup(display_name)
          .openPopup();
      }
      
      setSearchStatus('Location found!');
      setTimeout(() => setSearchStatus(''), 2000);
    } catch (error) {
      setSearchStatus(`Error: ${error.message}`);
      setTimeout(() => setSearchStatus(''), 5000);
    }
  };

  // Function to handle JSON file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setJsonFile(file);
      setFileName(file.name);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsedData = JSON.parse(event.target.result);
          setJsonData(parsedData);
        } catch (error) {
          console.error('Error parsing JSON:', error);
          alert('Error parsing JSON file. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  // Function to toggle step visibility
  const toggleStep = (index) => {
    setActiveStep(activeStep === index ? -1 : index);
  };
  
  // Function to update release location in the JSON data
  const updateReleaseLocation = () => {
    if (currentReleaseLocation && jsonData) {
      // Create a new JSON data object with updated coordinates
      const updatedJsonData = {
        ...jsonData,
        PrimaryInputs: {
          ...jsonData.PrimaryInputs,
          ApproxLatitude: parseFloat(currentReleaseLocation.lat),
          ApproxLongitude: parseFloat(currentReleaseLocation.lng)
        }
      };
      
      setJsonData(updatedJsonData);
      setLocationUpdated(false);
      alert('Release location has been updated successfully!');
    }
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
    setBuildings(updatedBuildings);
    
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
          setBuildings(updatedBuildings);
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
      } else {
        // All buildings placed, exit initial placement mode
        setIsInitialPlacement(false);
        if (circleRef.current) {
          mapRef.current.removeLayer(circleRef.current);
          circleRef.current = null;
        }
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
      
      // If the building has a location, center the map on it
      if (building.location) {
        mapRef.current.setView([building.location.lat, building.location.lng], 15);
      } else if (releaseMarkerRef.current) {
        // If not, center on the release point and show the distance circle
        const releasePoint = releaseMarkerRef.current.getLatLng();
        mapRef.current.setView([releasePoint.lat, releasePoint.lng], 15);
        
        // Show the distance circle
        circleRef.current = L.circle([releasePoint.lat, releasePoint.lng], {
          radius: building.DistanceFromRelease,
          color: '#3388ff',
          weight: 3,
          fillOpacity: 0.05
        }).addTo(mapRef.current);
        
        // Add one-time click handler for placement
        mapRef.current.once('click', function(e) {
          const position = e.latlng;
          setTempBuildingPosition(position);
          setShowConfirmationPopup(true);
          setCurrentBuildingIndex(buildingIndex);
        });
      }
    }
  };

  // Helper function to get occupancy level text
  const getOccupancyText = (level) => {
    switch(level) {
      case 0: return 'Low Occupancy';
      case 1: return 'Medium Occupancy';
      case 2: return 'High Occupancy';
      default: return 'Unknown Occupancy';
    }
  };

  // Helper function to get occupancy level class
  const getOccupancyClass = (level) => {
    switch(level) {
      case 0: return 'occupancy-low';
      case 1: return 'occupancy-medium';
      case 2: return 'occupancy-high';
      default: return '';
    }
  };

  return (
    <div className="map-container">
      {/* Left Panel */}
      <div className="left-panel">
        <div className="panel-header">
          Analysis Steps
        </div>
        <div className="panel-content">
          {/* Step 1 - Load JSON */}
          <div className="step">
            <div 
              className={`step-header ${activeStep === 0 ? 'active' : ''}`} 
              onClick={() => toggleStep(0)}
            >
              <span>1. Load JSON Data</span>
              <span>{activeStep === 0 ? '−' : '+'}</span>
            </div>
            {activeStep === 0 && (
              <div className="step-content">
                <div className="file-upload">
                  <label className="file-input-label">
                    <span>Upload your hazard study JSON file:</span>
                    <span className="file-button">Choose File</span>
                    <input 
                      type="file" 
                      accept=".json" 
                      className="file-input" 
                      onChange={handleFileChange} 
                    />
                  </label>
                  {fileName && (
                    <div className="file-name">
                      Selected: {fileName}
                    </div>
                  )}
                  {jsonData && (
                    <div className="json-preview">
                      {jsonData.PrimaryInputs && (
                        <>
                          <div>Study ID: {jsonData.PrimaryInputs.StudyID}</div>
                          <div>Description: {jsonData.PrimaryInputs.Description}</div>
                          <div>
                            Location: {jsonData.PrimaryInputs.ApproxLatitude}, 
                            {jsonData.PrimaryInputs.ApproxLongitude}
                          </div>
                          <div>Site: {jsonData.PrimaryInputs.Site}</div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Step 2 - Verify Release Location */}
          <div className="step">
            <div 
              className={`step-header ${activeStep === 1 ? 'active' : ''}`} 
              onClick={() => toggleStep(1)}
            >
              <span>2. Verify Release Location</span>
              <span>{activeStep === 1 ? '−' : '+'}</span>
            </div>
            {activeStep === 1 && (
              <div className="step-content">
                {jsonData && currentReleaseLocation ? (
                  <div className="location-info">
                    <p>Current release coordinates:</p>
                    <div className="coordinates">
                      Latitude: {currentReleaseLocation.lat}<br />
                      Longitude: {currentReleaseLocation.lng}
                    </div>
                    <p>Drag the marker on the map to adjust the release point location.</p>
                    <button 
                      className="done-button" 
                      onClick={updateReleaseLocation}
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <p>Please load a JSON file first to verify release location.</p>
                )}
              </div>
            )}
          </div>

          {/* Step 3 - Identify Building Locations */}
          <div className="step">
            <div 
              className={`step-header ${activeStep === 2 ? 'active' : ''}`} 
              onClick={() => toggleStep(2)}
            >
              <span>3. Identify Building Locations</span>
              <span>{activeStep === 2 ? '−' : '+'}</span>
            </div>
            {activeStep === 2 && (
              <div className="step-content">
                {jsonData && buildings.length > 0 ? (
                  <>
                    {isInitialPlacement && (
                      <div className="building-info">
                        <p>Locating building {currentBuildingIndex + 1} of {buildings.length}:</p>
                        <p>
                          <strong>
                            {buildings[currentBuildingIndex].BuildingNumber || 'Building'} - 
                            <span className={`occupancy-indicator ${getOccupancyClass(buildings[currentBuildingIndex].OccupancyLevel)}`}>
                              {getOccupancyText(buildings[currentBuildingIndex].OccupancyLevel)}
                            </span>
                          </strong>
                        </p>
                        <p>Distance from release: {buildings[currentBuildingIndex].DistanceFromRelease}m</p>
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
                  </>
                ) : (
                  <p>Please load a JSON file first to identify building locations.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="main-content">
        {/* Controls */}
        <div className="controls-panel">
          {/* Map type toggle */}
          <div className="map-type-container">
            <span className="map-type-label">Map Type:</span>
            <div className="button-group">
              <button 
                onClick={() => toggleMapLayer('street')}
                className={`map-button ${activeLayer === 'street' ? 'active-button' : 'inactive-button'}`}
              >
                Street
              </button>
              <button 
                onClick={() => toggleMapLayer('aerial')}
                className={`map-button ${activeLayer === 'aerial' ? 'active-button' : 'inactive-button'}`}
              >
                Satellite
              </button>

              {/* File Import Button */}
              <button 
                onClick={toggleFileImport}
                className="file-import-button"
              >
                Import File
              </button>

            </div>
          </div>
          
          {/* Geolocation button */}
          <div className="location-container">
            <button 
              onClick={getMyLocation}
              className="location-button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="button-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              My Location
            </button>
            {locationStatus && <span className="status-message">{locationStatus}</span>}
          </div>
          
          {/* Search form */}
          <form onSubmit={searchLocation} className="search-form">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a location..."
              className="search-input"
            />
            <button 
              type="submit"
              className="search-button"
            >
              Search
            </button>
            {searchStatus && <span className="status-message">{searchStatus}</span>}
          </form>
        </div>

        {/* Display FileImport component if visible */}
        {showFileImport && <FileImport />}
        
        {/* Building Guidance Banner */}
        {showBuildingGuidance && isInitialPlacement && (
          <div className="guidance-banner building">
            The circle shows the distance to building {buildings[currentBuildingIndex]?.BuildingNumber || `#${currentBuildingIndex + 1}`}. 
            Click anywhere on the circle to place the building marker at its approximate location.
          </div>
        )}
        
        {/* Regular Guidance Banner */}
        {showGuidanceBanner && (
          <div className="guidance-banner">
            Drag and drop the release point to the correct location. Click "Done" when complete.
          </div>
        )}
        
        {/* Building Confirmation Popup */}
        {showConfirmationPopup && (
          <div className="confirmation-popup">
            <div className="confirmation-content">
              <p>Confirm building location for {buildings[currentBuildingIndex]?.BuildingNumber || `Building #${currentBuildingIndex + 1}`}?</p>
              <div className="confirmation-buttons">
                <button className="cancel-button" onClick={cancelBuildingPlacement}>Cancel</button>
                <button className="confirm-button" onClick={confirmBuildingPlacement}>Confirm</button>
              </div>
            </div>
          </div>
        )}
        
        {/* Distance Circle Legend */}
        {circleRef.current && (
          <div className="circle-legend">
            Distance: {buildings[currentBuildingIndex]?.DistanceFromRelease}m
          </div>
        )}
        
        {/* Map container */}
        <div className="map-area" ref={mapContainerRef} />
      </div>
    </div>
  );
};

export default LeafletMap;