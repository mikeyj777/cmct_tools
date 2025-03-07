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

const LeafletMap = () => {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markerRef = useRef(null);
  const releaseMarkerRef = useRef(null);
  
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
    }
  }, [mapLoaded, jsonData]);

  // Update marker draggability based on active step
  useEffect(() => {
    if (releaseMarkerRef.current) {
      if (activeStep === 1) {
        releaseMarkerRef.current.dragging.enable();
        setShowGuidanceBanner(true);
      } else {
        releaseMarkerRef.current.dragging.disable();
        setShowGuidanceBanner(false);
      }
    }
  }, [activeStep]);

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
        
        {/* Guidance Banner */}
        {showGuidanceBanner && (
          <div className="guidance-banner">
            Drag and drop the release point to the correct location. Click "Done" when complete.
          </div>
        )}
        
        {/* Map container */}
        <div className="map-area" ref={mapContainerRef} />
      </div>
    </div>
  );
};

export default LeafletMap;