import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import geoJson from "./geojson.geojson";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

export default function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  // set the initial state of the map to Puerto Rico
  const [lng, setLng] = useState(-66.5901);
  const [lat, setLat] = useState(18.2208);
  const [zoom, setZoom] = useState(9);

  // read the data from the geojson file
  const [data, setData] = useState(geoJson);

  // get the user's current location
  const [currentLocation, setCurrentLocation] = useState(null);

  // fly to the user's current location
  const flytoLocation = () => {
    map.current.flyTo({
      center: [currentLocation?.lng, currentLocation?.lat],
      zoom: 14,
    });
  };

  // set the user's current location

  useEffect(() => {
    if (map.current) return; // initialize map only once

    // initialize the map object
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v10",
      center: [lng, lat],
      zoom: zoom,
      bearing: 0,
      pitch: 0,
    });

    // use the distance from the user's current location to filter the geojson data
    map.current.on("load", function () {
      // insert the layer beneath any symbol layer 3D buildings
      var layers = map.current.getStyle().layers;
      var labelLayerId = layers.find(function (layer) {
        return layer.type === "symbol" && layer.layout["text-field"];
      }).id;

      map.current.addLayer(
        {
          id: "3d-buildings",
          source: "composite",
          "source-layer": "building",
          filter: ["==", "extrude", "true"],
          type: "fill-extrusion",
          minzoom: 15,
          paint: {
            "fill-extrusion-color": "#aaa",
            "fill-extrusion-height": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15,
              0,
              15.05,
              ["get", "height"],
            ],
            "fill-extrusion-base": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15,
              0,
              15.05,
              ["get", "min_height"],
            ],
            "fill-extrusion-opacity": 0.6,
          },
        },
        labelLayerId
      );
    });

    // add some controls to the map
    // add a navigation control to the map
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // add a geolocation control to the map
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showAccuracyCircle: false,
      }),
      "top-right"
    );

    // add the geocoder to the map
    map.current.addControl(
      new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        marker: true,
        flyTo: true,
        placeholder: "Buscar una dirección en Puerto Rico",
        // add a default location to the geocoder that will be used to limit the
        // search to the bounds of Puerto Rico

        default: "Puerto Rico",

        proximity: {
          longitude: lng,
          latitude: lat,
        },
        //countries: "pr",
        // style the geocoder search input
        // https://docs.mapbox.com/api/maps/#geocoder
        marker: {
          color: "orange",
        },
        // make bigger the input search box
        // https://docs.mapbox.com/help/glossary/zoom-level/
        zoom: 10,
        // limit the search to Puerto Rico
        // https://docs.mapbox.com/help/glossary/proximity/
      }),
      "top-left"
    );

    // add a full screen control to the map
    map.current.addControl(new mapboxgl.FullscreenControl(), "top-right");

    // parse the geojson data and add in clusters to the map
    map.current.on("load", function () {
      // add a clustered GeoJSON source for a sample set of earthquakes
      map.current.addSource("earthquakes", {
        type: "geojson",
        // Point to GeoJSON data. This example visualizes all M1.0+ earthquakes
        // from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.
        data: data,
        cluster: true,
        clusterMaxZoom: 14, // Max zoom to cluster points on
        clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
      });

      map.current.addLayer({
        id: "clusters",
        type: "circle",
        source: "earthquakes",
        filter: ["has", "point_count"],
        paint: {
          // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
          // with three steps to implement three types of circles:
          //   * Blue, 20px circles when point count is less than 100
          //   * Yellow, 30px circles when point count is between 100 and 750
          //   * Pink, 40px circles when point count is greater than or equal to 750
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#51bbd6",
            100,
            "#1F4298",
            750,
            "#FF6800",
          ],
          "circle-radius": [
            "step",
            ["get", "point_count"],
            20,
            100,
            30,
            750,
            40,
          ],
        },
      });
      // add a count of the number of features in each cluster
      map.current.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "earthquakes",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 12,
        },
      });
      // if the point count is less than 100, then show the markers
      map.current.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "earthquakes",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#FF6800",
          "circle-radius": 6,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#fff",
        },
      });
    });

    map.current.on("move", () => {
      setLng(map.current.getCenter().lng.toFixed(6));
      setLat(map.current.getCenter().lat.toFixed(6));
      setZoom(map.current.getZoom().toFixed(0));
    });
  });

  // copy the longitude and latitude to the clipboard
  const copyLocation = () => {
    navigator.clipboard.writeText(
      `Longitude: ${lng} | Latitude: ${lat} | Zoom: ${zoom}`
    );
    // show a message to the user that the location was copied
    navigator.clipboard.readText().then((text) => {
      alert("Location copied to the clipboard: " + text);
    });
  };

  return (
    <div
      className="container"
      style={{
        height: "100vh",
        width: "100%",
        position: "absolute",
        top: "0",
        left: "0",
        zIndex: "1",
      }}
    >
      <div
        className="title"
        style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: "2",
          padding: "10px",
          backgroundColor: "white",
          opacity: "0.8",
        }}
      >
        <h1>Power Solar Map</h1>
        <h2>Clientes de Energía Solar en Puerto Rico</h2>
      </div>
      <div
        className="sidebar"
        style={{
          position: "absolute",
          bottom: "0",
          left: "0",
          zIndex: "2",
          padding: "10px",
          backgroundColor: "white",
          opacity: "0.9",
        }}
      >
        Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
        <span
          className="copy-icon"
          role="img"
          aria-label="copy"
          style={{
            cursor: "pointer",
            marginLeft: "10px",
            fontSize: "1.5em",
          }}
          onClick={copyLocation}
        >
          📋
        </span>
      </div>

      <div
        className="flyto"
        // style the button to the right of the map bottom
        style={{
          position: "absolute",
          bottom: "0",
          right: "0",
          zIndex: "2",
          padding: "10px",
          backgroundColor: "white",
          opacity: "0.9",
        }}
      >
        <button onClick={flytoLocation}>Fly to my location</button>
      </div>

      <div
        className="map-container"
        ref={mapContainer}
        style={{
          height: "100vh",
          width: "100%",
          position: "absolute",
          top: "0",
          left: "0",
          zIndex: "1",
        }}
      />
    </div>
  );
}
