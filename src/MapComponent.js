import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
// import marker-icon from public/marker-icon.png;

const MapComponent = ({ center, points }) => {
  // State to store the map center
  const [mapCenter, setMapCenter] = useState(center);

  const DefaultIcon = L.icon({
    iconUrl: "https://vinte.sh/images/icon.png",
    iconRetinaUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    popupAnchor: [-0, -0],
    iconSize: [32, 32],
  });

  useEffect(() => {
    // Update map center when 'center' prop changes
    setMapCenter(center);
  }, [center]);

  return (
    <MapContainer
      center={mapCenter}
      zoom={9}
      style={{
        height: "800px",
        width: "100%",
        position: "absolute",
        top: "0",
        left: "0",
        zIndex: "1",
      }}
      id="mapid"
      icon={DefaultIcon}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">Carto</a> contributors'
      />

      {/* Loop through points and add markers */}
      {points.map((point, index) => (
        <Marker position={[point.lat, point.lng]} icon={DefaultIcon}>
          <Popup>
            A point from CSV
            <br />
            Latitude: {point.lat}
            <br />
            Longitude: {point.lng}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapComponent;
