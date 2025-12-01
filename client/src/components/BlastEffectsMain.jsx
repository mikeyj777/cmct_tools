import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Step components
import JsonDataLoader from './steps/JsonDataLoader';
import ReleaseLocationEditor from './steps/ReleaseLocationEditor';
import BuildingPlacementTool from './steps/BuildingPlacementTool';
import FlammableExtentTool from './steps/FlammableExtentTool';
import CongestedVolumeIdentifier from './steps/CongestedVolumeIdentifier';
import FlammableMassTool from './steps/FlammableMassTool';
import VceEffectsTool from './steps/VceEffectsTool';
import PvBurstEffectsTool from './steps/PvBurstEffectsTool';
import DistanceToOverpressuresVce from './steps/DistanceToOverpressuresVce';
import OverpressureDistancesResultsModal from './ui/OverpressureDistancesResultsModal';


// Import the FileImport component
import FileImport from './FileImport';

// Import utilities
import { 
  fixLeafletDefaultIcon, 
  createReleaseIcon, 
  getBuildingIcon, 
  getOccupancyText,
  getOccupancyTextForModal,
  getOccupancyClass,
  initializeMap,
  createFlammableExtentCircle
} from '../utils/mapUtils';

// Import shared components
import GuidanceBanner from './ui/GuidanceBanner';

// Fix the default Leaflet icon issue
fixLeafletDefaultIcon();

// Get the release icon
const releaseIcon = createReleaseIcon();

const BlastEffectsMain = () => {
  // Map related refs
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markerRef = useRef(null);
  const releaseMarkerRef = useRef(null);
  const circleRef = useRef(null);
  const flammableExtentCircleRef = useRef(null);
  const buildingMarkersRef = useRef({});
  
  // Map UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activeLayer, setActiveLayer] = useState('aerial');
  const [searchStatus, setSearchStatus] = useState('');
  const [locationStatus, setLocationStatus] = useState('');
  const [showFileImport, setShowFileImport] = useState(false);
  const [showGuidanceBanner, setShowGuidanceBanner] = useState(false);
  const [guidanceBannerText, setGuidanceBannerText] = useState('');
  const [guidanceBannerType, setGuidanceBannerType] = useState('default'); // 'default', 'building', etc.
  
  // Application data state
  const [activeStep, setActiveStep] = useState(null);
  const [jsonData, setJsonData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [currentReleaseLocation, setCurrentReleaseLocation] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [flammableExtentData, setFlammableExtentData] = useState(null);
  const [showFlammableExtent, setShowFlammableExtent] = useState(false);
  const [congestedVolumes, setCongestedVolumes] = useState([]);
  const [buildingsWithOverpressure, setBuildingsWithOverpressure] = useState([]);
  const [showVceDistancesModal, setShowVceDistancesModal] = useState(false);
  const [showVceDistancesResults, setShowVceDistancesResults] = useState(false);
  // Optional: store last psi values to seed modal
  const [lastPsiValues, setLastPsiValues] = useState([0.5, 1, 2]);
  
  // Initialize the map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      // Initialize the map using our utility function
      mapRef.current = initializeMap(mapContainerRef.current);
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

  const resetData = () => {
    setFlammableExtentData(null);
    setShowFlammableExtent(false);
    setCongestedVolumes([]);
  }

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
          confirmed: false,
          name: building.BuildingNumber,
          occupancy: getOccupancyTextForModal(building.OccupancyLevel)
        }));
        setBuildings(buildingsWithLocation);
      }
      resetData();
    }
  }, [mapLoaded, jsonData]);

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
        
        // // Add or update marker
        // if (markerRef.current) {
        //   markerRef.current.setLatLng([latitude, longitude]);
        // } else {
        //   markerRef.current = L.marker([latitude, longitude])
        //     .addTo(mapRef.current)
        //     .bindPopup('Your location')
        //     .openPopup();
        // }
        
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
      // if (markerRef.current) {
      //   markerRef.current.setLatLng([lat, lon])
      //     .setPopupContent(display_name)
      //     .openPopup();
      // } else {
      //   markerRef.current = L.marker([lat, lon])
      //     .addTo(mapRef.current)
      //     .bindPopup(display_name)
      //     .openPopup();
      // }
      
      setSearchStatus('Location found!');
      setTimeout(() => setSearchStatus(''), 2000);
    } catch (error) {
      setSearchStatus(`Error: ${error.message}`);
      setTimeout(() => setSearchStatus(''), 5000);
    }
  };

  // Function to toggle step visibility
  const toggleStep = (index) => {
    setActiveStep(activeStep === index ? null : index);
    
  };

  useEffect(() => {
    setShowFlammableExtent(!!flammableExtentData);
  }, [flammableExtentData])

  // Function to toggle the FileImport modal
  const toggleFileImport = () => {
    setShowFileImport(!showFileImport);
  };

  // Function to update the guidance banner
  const updateGuidanceBanner = (text, type = 'default') => {
    setGuidanceBannerText(text);
    setGuidanceBannerType(type);
    setShowGuidanceBanner(!!text);
  };
  
  // Create a handler for processing file data
  const handleJsonData = (data, name) => {
    setJsonData(data);
    setFileName(name);
  };
  
  // Pass common map functions to sub-components
  const mapFunctions = {
    getMyLocation,
    toggleMapLayer,
    searchLocation
  };
  
  // Create an object with all the map-related references and state
  const mapState = {
    mapRef,
    mapLoaded,
    activeLayer,
    releaseMarkerRef,
    markerRef,
    circleRef,
    flammableExtentCircleRef,
    buildingMarkersRef
  };

  // Effect to display flammable extent circle when data is available
  useEffect(() => {
    if (mapLoaded && showFlammableExtent && currentReleaseLocation) {
      // Remove any existing flammable extent circle
      if (flammableExtentCircleRef.current) {
        mapRef.current.removeLayer(flammableExtentCircleRef.current);
        flammableExtentCircleRef.current = null;
      }
      
      // Only create circle if maximum_downwind_extent is greater than 0
      if (flammableExtentData && flammableExtentData.maximum_downwind_extent && flammableExtentData.maximum_downwind_extent > 0) {
        // Create a new flammable extent circle
        const releasePoint = [parseFloat(currentReleaseLocation.lat), parseFloat(currentReleaseLocation.lng)];
        
        // Use our utility function to create the flammable extent circle
        flammableExtentCircleRef.current = createFlammableExtentCircle(
          mapRef.current,
          releasePoint,
          flammableExtentData.maximum_downwind_extent
        );
        
        // Zoom map to show the entire flammable extent
        mapRef.current.fitBounds(flammableExtentCircleRef.current.getBounds());
      } else {
        // Optionally center map on release point if no extent to display
        const releasePoint = [parseFloat(currentReleaseLocation.lat), parseFloat(currentReleaseLocation.lng)];
        mapRef.current.setView(releasePoint, 15);
      }
    }
    
    return () => {
      // Cleanup function
      if (flammableExtentCircleRef.current && mapRef.current) {
        mapRef.current.removeLayer(flammableExtentCircleRef.current);
        flammableExtentCircleRef.current = null;
      }
    };
  }, [showFlammableExtent, currentReleaseLocation, mapLoaded, flammableExtentCircleRef, mapRef]);

  // When congestedVolumes update after calculations, open the results modal
  useEffect(() => {
    // If the input modal just closed and we have volumes with distances, show results
    if (!showVceDistancesModal && congestedVolumes?.length > 0) {
      const anyWithDistances = congestedVolumes.some(v => v.overpressureDistances || v.overpressureDistancesError);
      if (anyWithDistances) {
        setShowVceDistancesResults(true);
      }
    }
  }, [showVceDistancesModal, congestedVolumes]);
  
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
                <JsonDataLoader 
                  onDataLoaded={handleJsonData} 
                  currentData={jsonData}
                  fileName={fileName}
                />
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
                <ReleaseLocationEditor 
                  jsonData={jsonData}
                  currentReleaseLocation={currentReleaseLocation}
                  mapState={mapState}
                  updateGuidanceBanner={updateGuidanceBanner}
                  onLocationUpdate={(data) => {
                    setJsonData(data);
                    setCurrentReleaseLocation({
                      lat: data.PrimaryInputs.ApproxLatitude.toFixed(6),
                      lng: data.PrimaryInputs.ApproxLongitude.toFixed(6)
                    });
                  }}
                />
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
                <BuildingPlacementTool 
                  jsonData={jsonData}
                  buildings={buildings}
                  currentReleaseLocation={currentReleaseLocation}
                  mapState={mapState}
                  updateGuidanceBanner={updateGuidanceBanner}
                  getOccupancyText={getOccupancyText}
                  getBuildingIcon={getBuildingIcon}
                  onBuildingsUpdate={ (bldgs) => {
                    setBuildings(bldgs);
                  }}
                />
              </div>
            )}
          </div>
          
          {/* Step 4 - Get Flammable Extent */}
          <div className="step">
            <div 
              className={`step-header ${activeStep === 3 ? 'active' : ''}`} 
              onClick={() => toggleStep(3)}
            >
              <span>4. Get Flammable Extent</span>
              <span>{activeStep === 3 ? '−' : '+'}</span>
            </div>
            {activeStep === 3 && (
              <div className="step-content">
                <FlammableExtentTool 
                  currentFlammableExtentData={flammableExtentData}
                  jsonData={jsonData}
                  currentReleaseLocation={currentReleaseLocation}
                  mapState={mapState}
                  updateGuidanceBanner={updateGuidanceBanner}
                  onFlammableExtentData={(data) => {
                    setFlammableExtentData(data);
                  }}
                />
              </div>
            )}
          </div>

          {/* Step 5 - Identify Congested Volumes */}
          <div className="step">
            <div 
              className={`step-header ${activeStep === 4 ? 'active' : ''}`} 
              onClick={() => toggleStep(4)}
            >
              <span>5. Identify Congested Volumes</span>
              <span>{activeStep === 4 ? '−' : '+'}</span>
            </div>
            {activeStep === 4 && (
              <div className="step-content">
                <CongestedVolumeIdentifier 
                  jsonData={jsonData}
                  currentReleaseLocation={currentReleaseLocation}
                  mapState={mapState}
                  congestedVolumes={congestedVolumes}
                  updateGuidanceBanner={updateGuidanceBanner}
                  onCongestedVolumesUpdate={(volumes) => {
                    setCongestedVolumes(volumes);
                    // Optionally, you can update the JSON data or perform other actions
                    // For example:
                    // const updatedJsonData = {
                    //   ...jsonData,
                    //   CongestedVolumes: volumes
                    // };
                    // setJsonData(updatedJsonData);
                  }}
                />
              </div>
            )}
          </div>

          {/* Step 6 - Get Flammable Masses */}
          <div className="step">
            <div 
              className={`step-header ${activeStep === 5 ? 'active' : ''}`} 
              onClick={() => toggleStep(5)}
            >
              <span>6. Get Flammable Masses</span>
              <span>{activeStep === 5 ? '−' : '+'}</span>
            </div>
            {activeStep === 5 && (
              <div className="step-content">
                <FlammableMassTool 
                  jsonData={jsonData}
                  flammableExtentData={flammableExtentData}
                  currentReleaseLocation={currentReleaseLocation}
                  congestedVolumes={congestedVolumes}
                  updateGuidanceBanner={updateGuidanceBanner}
                  onCongestedVolumesUpdate={setCongestedVolumes}
                  onFlammableMassCalculated={(massData) => {
                    setCongestedVolumes(massData);
                  }}
                />
              </div>
            )}
          </div>

          {/* Step 7 - Calculate VCE Overpressure Effects on Buildings */}
          <div className="step">
            <div 
              className={`step-header ${activeStep === 6 ? 'active' : ''}`} 
              onClick={() => toggleStep(6)}
            >
              <span>7. Calculate VCE Effects on Buildings</span>
              <span>{activeStep === 6 ? '−' : '+'}</span>
            </div>
            {activeStep === 6 && (
              <div className="step-content">
                <VceEffectsTool 
                  jsonData={jsonData}
                  buildings={buildings}
                  congestedVolumes={congestedVolumes}
                  flammableExtentData={flammableExtentData}
                  updateGuidanceBanner={updateGuidanceBanner}
                  onBuildingsUpdate={(updatedBuildings) => {
                    setBuildings(updatedBuildings);
                    // You might also want to update your buildings state here
                    // setBuildings(updatedBuildings);
                  }}
                />
              </div>
            )}
          </div>

          {/* Step 8 - Get distances to overpressure limits for VCE */}
          <div className="step">
            <div
              className={`step-header ${activeStep === 7 ? 'active' : ''}`} // This becomes the new step 8 visually (0-based index => index 7)
              onClick={() => {
                if (!showVceDistancesModal) {
                  // Toggle the accordion normally
                  toggleStep(7);
                }
              }}
            >
              <span>8. Identify distances to overpressure limits for VCE</span>
              <span>{activeStep === 7 ? '−' : '+'}</span>
            </div>
            {activeStep === 7 && (
              <div className="step-content">
                <button
                  className="primary-button"
                  onClick={() => setShowVceDistancesModal(true)}
                  disabled={showVceDistancesModal}
                >
                  Set Overpressure Values
                </button>
                <p className="info-message" style={{ marginTop: '0.5rem' }}>
                  Calculates distances (meters) to the specified overpressure thresholds for each congested volume.
                </p>
              </div>
            )}
          </div>

          {/* Step 9 - Calculate PV Burst Effects on Buildings */}
          <div className="step">
            <div 
              className={`step-header ${activeStep === 8 ? 'active' : ''}`} 
              onClick={() => toggleStep(8)}
            >
              <span>9. Calculate PV Burst Effects on Buildings</span>
              <span>{activeStep === 8 ? '−' : '+'}</span>
            </div>
            {activeStep === 8 && (
              <div className="step-content">
                <PvBurstEffectsTool
                  jsonData={jsonData}
                  buildings={buildings}
                  updateGuidanceBanner={updateGuidanceBanner}
                  onBuildingsUpdate={(updatedBuildings) => {
                    setBuildings(updatedBuildings);
                  }}
                />
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
        {showFileImport && <FileImport onClose={toggleFileImport} />}
        
        {/* Guidance Banner */}
        {showGuidanceBanner && (
          <GuidanceBanner 
            text={guidanceBannerText}
            type={guidanceBannerType}
            visible={showGuidanceBanner}
          />
        )}
        
        {/* Map container */}
        <div className="map-area" ref={mapContainerRef} />
      </div>

      {showVceDistancesModal && (
        <DistanceToOverpressuresVce
          isOpen={showVceDistancesModal}
          onClose={() => setShowVceDistancesModal(false)}
          jsonData={jsonData}
          flammableExtentData={flammableExtentData}
          currentReleaseLocation={currentReleaseLocation}
          congestedVolumes={congestedVolumes}
          updateGuidanceBanner={updateGuidanceBanner}
          onCongestedVolumesUpdate={(vols) => {
            setCongestedVolumes(vols);
            // Store last-used psi inputs if you want to repopulate next time:
            // (The component itself owns the psi states; if you want them persisted here,
            //  pass a callback prop and collect them.)
          }}
          initialPsiValues={lastPsiValues}
        />
      )}

      {showVceDistancesResults && (
        <OverpressureDistancesResultsModal
          volumes={congestedVolumes}
          onClose={() => setShowVceDistancesResults(false)}
        />
      )}

    </div>
  );
};

export default BlastEffectsMain;