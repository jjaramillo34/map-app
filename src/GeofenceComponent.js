import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

const GeofenceComponent = ({ userLocation, points, maxDistance }) => {
  const filteredPoints = points.filter((point) => {
    const distance = getDistanceFromLatLonInKm(
      userLocation.lat,
      userLocation.lng,
      point.lat,
      point.lng
    );
    return distance <= maxDistance;
  });

  return (
    <div>
      <h3>Points within {maxDistance} km of your location:</h3>
      <p>
        Latitude: {userLocation.lat}, Longitude: {userLocation.lng}
      </p>

      <p>Points:</p>
      <p>Number of points: {filteredPoints.length}</p>

      <ul>
        {filteredPoints.map((point, index) => (
          <li key={index}>
            {point.name} ({point.lat}, {point.lng})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GeofenceComponent;
