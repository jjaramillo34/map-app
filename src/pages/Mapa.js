import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import geoJson from "../data/geojson.geojson";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import Layout from "../components/Layout";
import { Copy, LocateFixed, MapPin, RotateCcw } from "lucide-react";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

export default function Mapa() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  // set the initial state of the map to Puerto Rico
  const [lng, setLng] = useState(-66.5901);
  const [lat, setLat] = useState(18.2208);
  const [zoom, setZoom] = useState(9);

  // read the data from the geojson file
  const [data] = useState(geoJson);

  // get the user's current location
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  // fly to the user's current location
  const flytoLocation = () => {
    if (map.current && currentLocation) {
      map.current.flyTo({
        center: [currentLocation.lng, currentLocation.lat],
        zoom: 14,
      });
    }
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
      })?.id;

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
    const geolocate = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showAccuracyCircle: false,
      });
    map.current.addControl(
      geolocate,
      "top-right"
    );
    geolocate.on("geolocate", ({ coords }) => {
      setCurrentLocation({ lng: coords.longitude, lat: coords.latitude });
    });

    // add the geocoder to the map
    map.current.addControl(
      new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
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
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // copy the longitude and latitude to the clipboard
  const copyLocation = () => {
    navigator.clipboard.writeText(`Longitude: ${lng} | Latitude: ${lat} | Zoom: ${zoom}`);
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 1800);
  };

  const resetView = () => {
    map.current?.flyTo({ center: [-66.5901, 18.2208], zoom: 9, pitch: 0, bearing: 0 });
  };

  return (
    <Layout showFooter={false}>
      <div className="relative h-full w-full overflow-hidden" style={{ height: "calc(100vh - 80px)" }}>
        {/* Map Container */}
        <div className="absolute left-0 top-0 z-[1] h-full w-full" ref={mapContainer} />

        <div className="absolute left-4 top-4 z-10 max-w-[calc(100vw-2rem)] rounded-2xl border border-white/60 bg-white/90 p-4 shadow-xl backdrop-blur-md md:left-8 md:top-8">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary-100 p-2 text-primary-700">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary-700">Power Solar Map</p>
              <h1 className="mt-1 text-lg font-bold text-gray-900">Clientes solares en Puerto Rico</h1>
              <p className="mt-1 text-xs text-gray-600">Explora concentraciones y detalles por ubicación.</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2 border-t border-gray-200 pt-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-600"><span className="h-2.5 w-2.5 rounded-full bg-[#51bbd6]" />Menor concentración</span>
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-600"><span className="h-2.5 w-2.5 rounded-full bg-[#ff6800]" />Mayor concentración</span>
          </div>
        </div>

        {/* Info Panel */}
        <div className="absolute bottom-4 md:bottom-8 left-4 md:left-8 z-10 bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl min-w-[280px] overflow-hidden border border-black/5 md:max-w-none max-w-[calc(100vw-2rem)]">
          <div className="flex items-center justify-between bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-4 text-white">
            <h2 className="m-0 text-base font-semibold tracking-wide">Ubicación del mapa</h2>
            <button onClick={resetView} title="Restablecer vista" aria-label="Restablecer vista" className="rounded-lg p-1.5 hover:bg-white/20">
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
          <div className="p-5">
            <div className="flex justify-between items-center py-3 border-b border-black/5 last:border-b-0 last:mb-3">
              <span className="text-xs text-gray-600 font-medium uppercase tracking-wider">Longitude</span>
              <span className="text-sm text-gray-900 font-semibold font-mono">{lng}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-black/5 last:border-b-0 last:mb-3">
              <span className="text-xs text-gray-600 font-medium uppercase tracking-wider">Latitude</span>
              <span className="text-sm text-gray-900 font-semibold font-mono">{lat}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-black/5 last:border-b-0 last:mb-3">
              <span className="text-xs text-gray-600 font-medium uppercase tracking-wider">Zoom</span>
              <span className="text-sm text-gray-900 font-semibold font-mono">{zoom}</span>
            </div>
            <button
              onClick={copyLocation}
              title="Copiar ubicación"
              aria-label="Copiar ubicación"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 mt-2 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary-500/40 active:translate-y-0"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 2C4 1.44772 4.44772 1 5 1H11C11.5523 1 12 1.44772 12 2V6H13C13.5523 6 14 6.44772 14 7V13C14 13.5523 13.5523 14 13 14H7C6.44772 14 6 13.5523 6 13V12H5C4.44772 12 4 11.5523 4 11V2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 6H7C6.44772 6 6 6.44772 6 7V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <Copy className="h-4 w-4" />
              {isCopied ? "Copiado" : "Copiar ubicación"}
            </button>
          </div>
        </div>

        {/* Action Button */}
        {currentLocation && (
          <button
            onClick={flytoLocation}
            title="Fly to my location"
            className="absolute bottom-4 md:bottom-8 right-4 md:right-8 z-10 flex items-center gap-2 py-3.5 px-6 bg-white/98 backdrop-blur-md border border-black/5 rounded-xl text-sm md:text-base font-semibold text-gray-900 cursor-pointer transition-all duration-200 shadow-lg hover:-translate-y-0.5 hover:shadow-xl hover:bg-white active:translate-y-0"
          >
            <LocateFixed className="h-5 w-5 text-primary-500" />
            Mi ubicación
          </button>
        )}
      </div>
    </Layout>
  );
}
