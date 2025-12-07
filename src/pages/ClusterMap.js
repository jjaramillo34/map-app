import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import geoJson from "../data/geojson.geojson";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import Layout from "../components/Layout";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

export default function ClusterMap() {
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
      // Add clustered source
      map.current.addSource("solar-clusters", {
        type: "geojson",
        data: data,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      // Add cluster circles
      map.current.addLayer({
        id: "clusters",
        type: "circle",
        source: "solar-clusters",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#51bbd6",
            100,
            "#f1f075",
            750,
            "#f28cb1",
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
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });

      // Add cluster count labels
      map.current.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "solar-clusters",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 12,
        },
        paint: {
          "text-color": "#000",
        },
      });

      // Add unclustered points
      map.current.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "solar-clusters",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#FF6800",
          "circle-radius": 8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });

      // Click on cluster to zoom in
      map.current.on("click", "clusters", function (e) {
        const features = map.current.queryRenderedFeatures(e.point, {
          layers: ["clusters"],
        });
        const clusterId = features[0].properties.cluster_id;
        map.current
          .getSource("solar-clusters")
          .getClusterExpansionZoom(clusterId, function (err, zoom) {
            if (err) return;
            map.current.easeTo({
              center: features[0].geometry.coordinates,
              zoom: zoom,
            });
          });
      });

      // Click on point to show popup
      map.current.on("click", "unclustered-point", function (e) {
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

      // Change cursor on hover
      map.current.on("mouseenter", "clusters", function () {
        map.current.getCanvas().style.cursor = "pointer";
      });
      map.current.on("mouseleave", "clusters", function () {
        map.current.getCanvas().style.cursor = "";
      });
      map.current.on("mouseenter", "unclustered-point", function () {
        map.current.getCanvas().style.cursor = "pointer";
      });
      map.current.on("mouseleave", "unclustered-point", function () {
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
          <div className="px-4 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
            <h3 className="m-0 text-base font-semibold tracking-wide">Mapa de Clusters</h3>
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
              <p className="text-xs text-gray-600 mb-2">💡 Haz clic en los clusters para acercar</p>
              <p className="text-xs text-gray-600">💡 Haz clic en los puntos para ver detalles</p>
            </div>
          </div>
        </div>

        <div className="absolute top-0 left-0 w-full h-full z-[1]" ref={mapContainer} />
      </div>
    </Layout>
  );
}

