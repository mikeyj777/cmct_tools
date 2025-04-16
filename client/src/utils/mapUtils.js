import L from 'leaflet';

// Create a custom marker icon for the release point
export const createReleaseIcon = () => {
  return L.icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

// Create functions to get marker icons based on occupancy level
export const getBuildingIcon = (occupancyLevel) => {
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

// Helper function to create distance circles
export const createDistanceCircle = (map, centerPoint, radius, options = {}) => {
  const defaultOptions = {
    color: '#3388ff',
    weight: 3,
    fillOpacity: 0.05,
    ...options
  };
  
  return L.circle(centerPoint, {
    radius,
    ...defaultOptions
  }).addTo(map);
};

// Helper function to create flammable extent circles
export const createFlammableExtentCircle = (map, centerPoint, radius, options = {}) => {
  const defaultOptions = {
    color: 'red',
    weight: 2,
    fillColor: '#ffcccc',
    fillOpacity: 0.3,
    dashArray: '5, 10',
    ...options
  };
  
  return L.circle(centerPoint, {
    radius,
    ...defaultOptions
  }).addTo(map);
};

// Helper function to get Leaflet map layers
export const createMapLayers = () => {
  // Street layer
  const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });
  
  // Aerial/satellite layer
  const aerialLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  });
  
  return {
    street: streetLayer,
    aerial: aerialLayer
  };
};

// Helper function to get occupancy level text
export const getOccupancyText = (level) => {
  switch(level) {
    case 0: return 'Low Occupancy';
    case 1: return 'Medium Occupancy';
    case 2: return 'High Occupancy';
    default: return 'Unknown Occupancy';
  }
};

export const getOccupancyTextForModal = (level) => {
  switch(level) {
    case 0: return 'low';
    case 1: return 'med';
    case 2: return 'high';
    default: return 'Unknown Occupancy';
  }
};

// Helper function to get occupancy level class for styling
export const getOccupancyClass = (level) => {
  switch(level) {
    case 0: return 'occupancy-low';
    case 1: return 'occupancy-medium';
    case 2: return 'occupancy-high';
    default: return '';
  }
};

// Get API URL based on environment
export const getApiUrl = () => {
  const apiUrl = process.env.REACT_APP_ENV === "prod" ? process.env.REACT_APP_API_URL_PROD : process.env.REACT_APP_API_URL_DEV;
  return apiUrl;
};

// Initialize leaflet map with common settings
export const initializeMap = (mapContainerRef, initialView = [51.505, -0.09], zoom = 13) => {
  // Create map
  const map = L.map(mapContainerRef).setView(initialView, zoom);
  
  // Get map layers
  const layers = createMapLayers();
  
  // Add the aerial layer by default
  layers.aerial.addTo(map);
  
  // Store layers for later toggling
  map.layers = layers;
  
  return map;
};

// Fix default Leaflet icon issues
export const fixLeafletDefaultIcon = () => {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};