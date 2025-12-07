import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import geoJson from "../data/geojson.geojson";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import Layout from "../components/Layout";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

export default function Map3D() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(-66.5901);
  const [lat, setLat] = useState(18.2208);
  const [zoom, setZoom] = useState(9);
  const [pitch, setPitch] = useState(45);
  const [data] = useState(geoJson);

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [lng, lat],
      zoom: zoom,
      pitch: pitch,
      bearing: 0,
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
      // Add 3D buildings
      const layers = map.current.getStyle().layers;
      const labelLayerId = layers.find(
        (layer) => layer.type === "symbol" && layer.layout["text-field"]
      )?.id;

      if (labelLayerId) {
        map.current.addLayer(
          {
            id: "3d-buildings",
            source: "composite",
            "source-layer": "building",
            filter: ["==", "extrude", "true"],
            type: "fill-extrusion",
            minzoom: 14,
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
              "fill-extrusion-opacity": 0.8,
            },
          },
          labelLayerId
        );
      }

      // Add solar points with 3D effect
      map.current.addSource("solar-3d", {
        type: "geojson",
        data: data,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      // Add clusters
      map.current.addLayer({
        id: "solar-clusters-3d",
        type: "circle",
        source: "solar-3d",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#FF6800",
          "circle-radius": [
            "step",
            ["get", "point_count"],
            20,
            100,
            30,
            750,
            40,
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });

      // Add cluster count
      map.current.addLayer({
        id: "solar-cluster-count-3d",
        type: "symbol",
        source: "solar-3d",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 12,
        },
        paint: {
          "text-color": "#fff",
        },
      });

      // Add unclustered points with 3D circles
      map.current.addLayer({
        id: "solar-points-3d",
        type: "circle",
        source: "solar-3d",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#FF6800",
          "circle-radius": 8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
          "circle-opacity": 0.9,
        },
      });

      // Click handlers
      map.current.on("click", "solar-clusters-3d", function (e) {
        const features = map.current.queryRenderedFeatures(e.point, {
          layers: ["solar-clusters-3d"],
        });
        const clusterId = features[0].properties.cluster_id;
        map.current
          .getSource("solar-3d")
          .getClusterExpansionZoom(clusterId, function (err, zoom) {
            if (err) return;
            map.current.easeTo({
              center: features[0].geometry.coordinates,
              zoom: zoom,
            });
          });
      });

      map.current.on("click", "solar-points-3d", function (e) {
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

      map.current.on("mouseenter", "solar-clusters-3d", function () {
        map.current.getCanvas().style.cursor = "pointer";
      });
      map.current.on("mouseleave", "solar-clusters-3d", function () {
        map.current.getCanvas().style.cursor = "";
      });
      map.current.on("mouseenter", "solar-points-3d", function () {
        map.current.getCanvas().style.cursor = "pointer";
      });
      map.current.on("mouseleave", "solar-points-3d", function () {
        map.current.getCanvas().style.cursor = "";
      });
    });

    map.current.on("move", () => {
      setLng(map.current.getCenter().lng.toFixed(6));
      setLat(map.current.getCenter().lat.toFixed(6));
      setZoom(map.current.getZoom().toFixed(0));
      setPitch(map.current.getPitch().toFixed(0));
    });
  });

  return (
    <Layout showFooter={false}>
      <div className="relative w-full overflow-hidden" style={{ height: "calc(100vh - 80px)" }}>
        {/* Info Panel */}
        <div className="absolute bottom-4 md:bottom-8 left-4 md:left-8 z-10 bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl min-w-[280px] overflow-hidden border border-black/5">
          <div className="px-4 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <h3 className="m-0 text-base font-semibold tracking-wide">Vista 3D</h3>
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
            <div className="flex justify-between items-center py-3 border-b border-black/5 last:border-b-0 last:mb-3">
              <span className="text-xs text-gray-600 font-medium uppercase tracking-wider">Pitch</span>
              <span className="text-sm text-gray-900 font-semibold font-mono">{pitch}°</span>
            </div>
            <div className="mt-4 pt-4 border-t border-black/5">
              <p className="text-xs text-gray-600 mb-2">🌍 Vista satelital con edificios 3D</p>
              <p className="text-xs text-gray-600">🖱️ Arrastra para rotar la vista</p>
            </div>
          </div>
        </div>

        <div className="absolute top-0 left-0 w-full h-full z-[1]" ref={mapContainer} />
      </div>
    </Layout>
  );
}

