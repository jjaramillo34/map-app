import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import geoJson from "../data/geojson.geojson";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import Layout from "../components/Layout";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

export default function HeatMap() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(-66.5901);
  const [lat, setLat] = useState(18.2208);
  const [zoom, setZoom] = useState(9);
  const [data] = useState(geoJson);

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v10",
      center: [lng, lat],
      zoom: zoom,
    });

    // Add geocoder
    map.current.addControl(
      new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        marker: false,
        placeholder: "Buscar una dirección en Puerto Rico",
        proximity: {
          longitude: lng,
          latitude: lat,
        },
      }),
      "top-left"
    );

    // Add controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.current.addControl(new mapboxgl.FullscreenControl(), "top-right");

    map.current.on("load", function () {
      // Add heatmap source
      map.current.addSource("solar-heatmap", {
        type: "geojson",
        data: data,
      });

      // Add heatmap layer
      map.current.addLayer({
        id: "solar-heat",
        type: "heatmap",
        source: "solar-heatmap",
        maxzoom: 15,
        paint: {
          "heatmap-weight": 1,
          "heatmap-intensity": {
            stops: [
              [11, 1],
              [15, 3],
            ],
          },
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(33,102,172,0)",
            0.2,
            "rgb(103,169,207)",
            0.4,
            "rgb(209,229,240)",
            0.6,
            "rgb(253,219,199)",
            0.8,
            "rgb(239,138,98)",
            1,
            "rgb(178,24,43)",
          ],
          "heatmap-radius": {
            stops: [
              [11, 15],
              [15, 30],
            ],
          },
          "heatmap-opacity": {
            default: 1,
            stops: [
              [14, 1],
              [15, 0.8],
            ],
          },
        },
      });

      // Add points layer for higher zoom
      map.current.addLayer({
        id: "solar-points",
        type: "circle",
        source: "solar-heatmap",
        minzoom: 15,
        paint: {
          "circle-radius": 6,
          "circle-color": "#FF6800",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
          "circle-opacity": {
            stops: [
              [14, 0],
              [15, 1],
            ],
          },
        },
      });

      // Click on point to show popup
      map.current.on("click", "solar-points", function (e) {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const properties = e.features[0].properties;
        
        new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: true,
          className: 'custom-popup',
        })
          .setLngLat(coordinates)
          .setHTML(
            '<div class="p-5">' +
              '<h3 class="m-0 mb-2 text-lg font-bold text-gray-900 leading-tight">' +
              (properties.City || properties.Street || "Ubicación") +
              '</h3>' +
              '<p class="m-0 text-sm text-gray-600 leading-relaxed">' +
              (properties.Street ? properties.Street + ", " : "") +
              (properties.City || "") +
              '</p>' +
            '</div>'
          )
          .addTo(map.current);
      });

      map.current.on("mouseenter", "solar-points", function () {
        map.current.getCanvas().style.cursor = "pointer";
      });
      map.current.on("mouseleave", "solar-points", function () {
        map.current.getCanvas().style.cursor = "";
      });
    });

    map.current.on("move", () => {
      setLng(map.current.getCenter().lng.toFixed(6));
      setLat(map.current.getCenter().lat.toFixed(6));
      setZoom(map.current.getZoom().toFixed(0));
    });
  });

  return (
    <Layout showFooter={false}>
      <div className="relative w-full overflow-hidden" style={{ height: "calc(100vh - 80px)" }}>
        {/* Info Panel */}
        <div className="absolute bottom-4 md:bottom-8 left-4 md:left-8 z-10 bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl min-w-[280px] overflow-hidden border border-black/5">
          <div className="px-4 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white">
            <h3 className="m-0 text-base font-semibold tracking-wide">Mapa de Calor</h3>
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
            <div className="mt-4 pt-4 border-t border-black/5">
              <p className="text-xs text-gray-600 mb-2">🔥 Las áreas más calientes indican mayor concentración</p>
              <p className="text-xs text-gray-600">📍 Acerca para ver puntos individuales</p>
            </div>
          </div>
        </div>

        <div className="absolute top-0 left-0 w-full h-full z-[1]" ref={mapContainer} />
      </div>
    </Layout>
  );
}

