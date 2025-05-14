/**
 * Calculates the distance between two points on Earth using the Haversine formula
 * @param {number} lat1 - Latitude of first point in decimal degrees
 * @param {number} lon1 - Longitude of first point in decimal degrees
 * @param {number} lat2 - Latitude of second point in decimal degrees
 * @param {number} lon2 - Longitude of second point in decimal degrees
 * @returns {number} Distance in meters
 */
export const haversineDistance = (lat1, lon1, lat2, lon2) => {
  // Radius of the Earth in meters
  const R = 6371000; 

  // Convert latitude and longitude to radians
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  // Haversine formula
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Calculates bearing between two geographic points
 * @param {number} lat1 - Latitude of first point in decimal degrees
 * @param {number} lon1 - Longitude of first point in decimal degrees
 * @param {number} lat2 - Latitude of second point in decimal degrees
 * @param {number} lon2 - Longitude of second point in decimal degrees
 * @returns {number} Bearing in degrees (0-360)
 */
const calculateBearing = (lat1, lon1, lat2, lon2) => {
  // Convert to radians
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - 
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  
  let θ = Math.atan2(y, x);
  θ = θ * 180 / Math.PI; // Convert to degrees
  
  // Normalize to 0-360 degrees
  return (θ + 360) % 360;
};

/**
 * Calculates destination point given start point, distance, and bearing
 * @param {number} lat - Starting latitude in decimal degrees
 * @param {number} lon - Starting longitude in decimal degrees
 * @param {number} distance - Distance in meters
 * @param {number} bearing - Bearing in degrees
 * @returns {Object} Object with destination latitude and longitude
 */
const destinationPoint = (lat, lon, distance, bearing) => {
  const R = 6371000; // Earth's radius in meters
  
  // Convert inputs to radians
  const φ1 = lat * Math.PI / 180;
  const λ1 = lon * Math.PI / 180;
  const θ = bearing * Math.PI / 180;
  
  const δ = distance / R; // Angular distance
  
  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(δ) + 
    Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)
  );
  
  const λ2 = λ1 + Math.atan2(
    Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
    Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
  );
  
  // Convert back to degrees
  return {
    lat: φ2 * 180 / Math.PI,
    lon: λ2 * 180 / Math.PI
  };
};

/**
 * Calculates volume extents based on release location
 * @param {Object} volume - Congested volume object
 * @param {Object} releaseLocation - Release location with lat and lng
 * @returns {Object} Object with calculated extents
 */
export const calculateVolumeExtents = (volume, releaseLocation) => {
  // Calculate bearing from release location to volume position
  const bearing = calculateBearing(
    releaseLocation.lat, 
    releaseLocation.lng, 
    volume.position.lat, 
    volume.position.lng
  );
  
  // Calculate distance between release location and volume position
  const distance = haversineDistance(
    releaseLocation.lat, 
    releaseLocation.lng, 
    volume.position.lat, 
    volume.position.lng
  );

  return {
    xMin: Math.cos(bearing * Math.PI / 180) * distance,
    yMin: Math.sin(bearing * Math.PI / 180) * distance,
    xMax: Math.cos(bearing * Math.PI / 180) * distance + volume.length,
    yMax: Math.sin(bearing * Math.PI / 180) * distance + volume.width,
    zMin: volume.elevationAboveGrade || 0,
    zMax: (volume.elevationAboveGrade || 0) + volume.height
  };
};