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

  // get the user's current location using mapbox
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Success handler
          const userLocation = {
            lng: position.coords.longitude,
            lat: position.coords.latitude,
          };
          setCurrentLocation(userLocation);
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

  // set the user's current location

  useEffect(() => {
    if (map.current) return; // initialize map only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      // map style cartodb light
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

    // add day, night, and satellite layers to the map
    map.current.on("load", function () {
      // Add a geojson point source.
      // Heatmap layers also work with a vector tile source.
      map.current.addSource("earthquakes", {
        type: "geojson",
        data: data,
      });

      map.current.addLayer(
        {
          id: "earthquakes-heat",
          type: "heatmap",
          source: "earthquakes",
          maxzoom: 9,
          paint: {
            // increase weight as diameter breast height increases
            "heatmap-weight": {
              property: "dbh",
              type: "exponential",
              stops: [
                [1, 0],
                [62, 1],
              ],
            },
            // increase intensity as zoom level increases
            "heatmap-intensity": {
              stops: [
                [11, 1],
                [15, 3],
              ],
            },
            // assign color values be applied to points depending on their density
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0,
              "rgba(236,222,239,0)",
              0.2,
              "rgb(208,209,230)",
              0.4,
              "rgb(166,189,219)",
              0.6,
              "rgb(103,169,207)",
              0.8,
              "rgb(28,144,153)",
            ],
            // increase radius as zoom increases
            "heatmap-radius": {
              stops: [
                [11, 15],
                [15, 20],
              ],
            },
            // decrease opacity to transition into the circle layer
            "heatmap-opacity": {
              default: 1,
              stops: [
                [14, 1],
                [15, 0],
              ],
            },
          },
        },
        "waterway-label"
      );

      map.current.addLayer(
        {
          id: "earthquakes-point",
          type: "circle",
          source: "earthquakes",
          minzoom: 14,
          paint: {
            // increase the radius of the circle as the zoom level and dbh value increases
            "circle-radius": {
              property: "dbh",
              type: "exponential",
              stops: [
                [{ zoom: 15, value: 1 }, 5],
                [{ zoom: 15, value: 62 }, 10],
                [{ zoom: 22, value: 1 }, 20],
                [{ zoom: 22, value: 62 }, 50],
              ],
            },
            "circle-color": {
              property: "dbh",
              type: "exponential",
              stops: [
                [0, "rgba(236,222,239,0)"],
                [10, "rgb(236,222,239)"],
                [20, "rgb(208,209,230)"],
                [30, "rgb(166,189,219)"],
                [40, "rgb(103,169,207)"],
                [50, "rgb(28,144,153)"],
                [60, "rgb(1,108,89)"],
              ],
            },
            "circle-stroke-color": "white",
            "circle-stroke-width": 1,

            // transition from heatmap to circle layer by increasing opacity value
            "circle-opacity": {
              stops: [
                [14, 0],
                [15, 1],
              ],
            },
          },
        },
        "waterway-label"
      );

      map.current.addLayer(
        {
          id: "earthquakes-label",
          type: "symbol",
          source: "earthquakes",
          minzoom: 15,
          layout: {
            "text-field": ["format", ["get", "dbh"], { "font-scale": 1.2 }],
            "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
            "text-offset": [0, 0.1],
            "text-anchor": "top",
          },
          paint: {
            "text-color": "rgba(0,0,0,0.5)",
          },
        },
        "waterway-label"
      );
    });

    // add the geocoder to the map
    map.current.addControl(
      new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        marker: true,
        flyTo: true,
        placeholder: "Search for a location in Puerto Rico",
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

    // parse the geojson data and add it to the map
    map.current.on("load", function () {
      map.current.addSource("places", {
        type: "geojson",
        data: data,
      });
      // use a custom map marker
      map.current.loadImage(
        // fetch the icon from the https://datanaly.st/icon.png
        "https://i.postimg.cc/VvDWWZhP/icon-1.png",
        // update the icon size to match the size of the custom icon

        function (error, image) {
          if (error) throw error;
          map.current.addImage("custom-marker", image);
          map.current.addLayer({
            id: "places",
            type: "symbol",
            source: "places",
            layout: {
              "icon-image": "custom-marker",
              // get the title name from the source's "title" property
              "text-field": ["get", "title"],
              "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
              "text-offset": [0, 1.25],
              "text-anchor": "top",
              // get the icon size from the source's "iconSize" property

              "icon-allow-overlap": true,
              "icon-ignore-placement": true,
              "icon-padding": 0,
              "icon-rotate": 0,
              "text-size": 12,
              // size of the icon on the map
              "icon-size": 0.4,
            },
          });
        }
      );
    });

    // add a popup to the map when a user clicks on a place
    map.current.on("click", "places", function (e) {
      var coordinates = e.features[0].geometry.coordinates.slice();
      var description = e.features[0].properties.description;
      var name = e.features[0].properties.name;

      // make a popup for each place
      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML("<h3>" + name + "</h3><p>" + description + "</p>")
        .addTo(map.current);
    });

    // add a hover effect to the map
    map.current.on("mouseenter", "places", function () {
      map.current.getCanvas().style.cursor = "pointer";
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // add the current location control change the icon and label colors
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: false,
        onGeolocate: function (position) {
          var userLocation = {
            lng: position.coords.longitude,
            lat: position.coords.latitude,
          };
          setCurrentLocation(userLocation);
        },
        label: "🧭",
        showUserLocation: true,
        labelVisible: true,
        labelPosition: "top",
        labelStyle: {
          backgroundColor: "rgba(255,255,255,0.8)",
          borderRadius: "5px",
          padding: "5px",
        },
        labelFormatter: function (coordinates) {
          var lat = coordinates.lat.toFixed(4);
          var lng = coordinates.lng.toFixed(4);
          return "Lat: " + lat + " Lng: " + lng;
        },
        language: "en",
        labelText: "My Location",
      }),

      "top-right"
    );

    // draw a circle around the user's current location and use it to filter the geojson
    map.current.on("load", function () {
      map.current.addSource("currentLocation", {
        type: "geojson",
        data: {
          type: "Point",
          coordinates: [currentLocation?.lng, currentLocation?.lat],
        },
      });
      map.current.addLayer({
        id: "currentLocation",
        type: "circle",
        source: "currentLocation",
        paint: {
          "circle-radius": 10,
          "circle-color": "#007cbf",
          "circle-opacity": 0.5,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#007cbf",
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
