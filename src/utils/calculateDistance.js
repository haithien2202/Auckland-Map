// src/utils/calculateDistance.js

// Function to calculate distance between two LatLng points using the Haversine formula
// Returns the distance in feet
export const calculateDistanceInFeet = (latlng1, latlng2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = ((latlng2.lat - latlng1.lat) * Math.PI) / 180; // Convert degrees to radians
  const dLon = ((latlng2.lng - latlng1.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((latlng1.lat * Math.PI) / 180) *
    Math.cos((latlng2.lat * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distanceInKm = R * c; // Distance in kilometers
  const distanceInFeet = distanceInKm * 3280.84; // Convert kilometers to feet

  return parseFloat(distanceInFeet.toFixed(2)); // Return the distance in feet, rounded to 2 decimal places
};
