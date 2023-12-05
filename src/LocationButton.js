import React from "react";

const LocationButton = ({ onLocationFound }) => {
  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Success handler
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          onLocationFound(userLocation);
        },
        (error) => {
          // Error handler
          console.error("Error getting location: ", error);
        }
      );
    } else {
      // Browser doesn't support Geolocation
      console.error("Geolocation is not supported by this browser.");
    }
  };

  return <button onClick={getLocation}>Get Location</button>;
};

export default LocationButton;
