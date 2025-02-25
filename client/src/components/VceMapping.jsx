import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Default leaflet marker icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const VceMapping = () => {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markerRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activeLayer, setActiveLayer] = useState('street');
  const [searchStatus, setSearchStatus] = useState('');
  const [locationStatus, setLocationStatus] = useState('');

  // Initialize the map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      // Create map
      const map = L.map(mapContainerRef.current).setView([51.505, -0.09], 13);
      
      // Add the default street layer
      const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      
      // Add aerial/satellite layer
      const aerialLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      });
      
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

  return (
    <div className="map-container">
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
      
      {/* Map container */}
      <div className="map-area" ref={mapContainerRef} />
    </div>
  );
};

export default VceMapping;
