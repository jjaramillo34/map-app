import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import municipalityBoundaries from "../data/municipalities.geojson";

const SOURCE_ID = "municipality-boundaries";
const FILL_LAYER = "municipality-fill";
const FILL_SELECTED_LAYER = "municipality-fill-selected";
const LINE_LAYER = "municipality-line";
const LINE_SELECTED_LAYER = "municipality-line-selected";
const LABEL_LAYER = "municipality-label";

const themes = {
  light: {
    fill: "#1F4298",
    fillOpacity: 0.08,
    hoverOpacity: 0.2,
    selectedFill: "#FF6800",
    selectedFillOpacity: 0.22,
    line: "#1F4298",
    selectedLine: "#FF6800",
    label: "#1F4298",
    halo: "#ffffff",
  },
  dark: {
    fill: "#7dd3fc",
    fillOpacity: 0.05,
    hoverOpacity: 0.16,
    selectedFill: "#FF6800",
    selectedFillOpacity: 0.2,
    line: "#7dd3fc",
    selectedLine: "#FF6800",
    label: "#e2e8f0",
    halo: "#0f172a",
  },
};

export function namesMatch(left, right) {
  if (!left || !right) return false;
  return String(left).localeCompare(String(right), "es", { sensitivity: "base" }) === 0;
}

export async function resolveGeoJson(data) {
  if (data && typeof data === "object") return data;
  if (typeof data === "string" && (data.startsWith("/") || data.startsWith("http"))) {
    const response = await fetch(data);
    return response.json();
  }
  if (typeof data === "string") {
    return JSON.parse(data);
  }
  return { type: "FeatureCollection", features: [] };
}

export async function loadMunicipalityBoundaries() {
  return resolveGeoJson(municipalityBoundaries);
}

export function findMunicipalityFeature(collection, name) {
  return (collection?.features || []).find((feature) =>
    namesMatch(feature.properties?.NAME, name)
  );
}

export function officialMunicipalityName(collection, name) {
  return findMunicipalityFeature(collection, name)?.properties?.NAME || name;
}

export function municipalityNames(collection) {
  return [...new Set((collection?.features || []).map((feature) => feature.properties?.NAME).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, "es")
  );
}

export function getFeatureBounds(feature) {
  const bounds = new mapboxgl.LngLatBounds();

  const walk = (coords) => {
    if (!Array.isArray(coords) || coords.length === 0) return;
    if (typeof coords[0] === "number") {
      bounds.extend(coords);
      return;
    }
    coords.forEach(walk);
  };

  walk(feature?.geometry?.coordinates);
  return bounds;
}

export function withCustomerCounts(boundaryCollection, pointCollection) {
  const counts = {};

  (pointCollection?.features || []).forEach((feature) => {
    const props = feature.properties || {};
    const candidates = [
      props.County?.replace(" Municipio", "").trim(),
      props.Municipio,
      props.City,
    ].filter(Boolean);

    const match = (boundaryCollection?.features || []).find((boundary) =>
      candidates.some((candidate) => namesMatch(boundary.properties?.NAME, candidate))
    );
    const key = match?.properties?.NAME;
    if (!key) return;
    counts[key] = (counts[key] || 0) + 1;
  });

  return {
    type: "FeatureCollection",
    features: (boundaryCollection?.features || []).map((feature) => ({
      ...feature,
      properties: {
        ...feature.properties,
        customerCount: counts[feature.properties?.NAME] || 0,
      },
    })),
  };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function highlightMunicipalities(map, names = []) {
  if (!map?.getLayer(FILL_SELECTED_LAYER)) return;
  const list = (names || []).filter(Boolean);
  const selectedFilter = list.length
    ? ["in", ["get", "NAME"], ["literal", list]]
    : ["==", ["get", "NAME"], ""];
  map.setFilter(FILL_SELECTED_LAYER, selectedFilter);
  map.setFilter(LINE_SELECTED_LAYER, selectedFilter);
}

export function highlightMunicipality(map, name) {
  highlightMunicipalities(map, name ? [name] : []);
}

export function setMunicipalityFillColor(map, expression, opacity) {
  if (!map?.getLayer(FILL_LAYER) || !expression) return;
  map.setPaintProperty(FILL_LAYER, "fill-color", expression);
  if (Number.isFinite(opacity)) {
    map.setPaintProperty(FILL_LAYER, "fill-opacity", [
      "case",
      ["boolean", ["feature-state", "hover"], false],
      Math.min(1, opacity + 0.15),
      opacity,
    ]);
  }
}

export function fitMapToMunicipality(map, collection, name) {
  const feature = findMunicipalityFeature(collection, name);
  if (!map || !feature) return false;

  const bounds = getFeatureBounds(feature);
  if (bounds.isEmpty()) return false;

  map.fitBounds(bounds, {
    padding: { top: 60, bottom: 60, left: 40, right: 40 },
    maxZoom: 12,
    duration: 900,
  });
  return true;
}

export function addMunicipalityBoundaryLayers(map, options = {}) {
  const {
    data,
    sourceId = SOURCE_ID,
    theme = "light",
    interactive = false,
    showLabels = true,
    showFill = true,
    selectedName = null,
    onSelect,
    choroplethProperty = null,
    fillColorExpression = null,
    fillOpacity = null,
    showPopup = true,
    beforeId = undefined,
  } = options;

  if (!map || !data?.features?.length) return;
  const colors = themes[theme] || themes.light;

  if (map.getSource(sourceId)) {
    map.getSource(sourceId).setData(data);
    if (selectedName) highlightMunicipality(map, selectedName, sourceId);
    if (fillColorExpression) setMunicipalityFillColor(map, fillColorExpression, fillOpacity);
    return;
  }

  map.addSource(sourceId, {
    type: "geojson",
    data,
    promoteId: "NAME",
  });

  if (showFill) {
    const colorExpression = fillColorExpression
      || (choroplethProperty
        ? [
            "interpolate",
            ["linear"],
            ["get", choroplethProperty],
            0,
            "#dbeafe",
            100,
            "#93c5fd",
            300,
            "#3b82f6",
            700,
            "#1F4298",
            1200,
            "#FF6800",
          ]
        : colors.fill);
    const baseOpacity = Number.isFinite(fillOpacity)
      ? fillOpacity
      : choroplethProperty || fillColorExpression
        ? 0.55
        : colors.fillOpacity;

    map.addLayer({
      id: FILL_LAYER,
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": colorExpression,
        "fill-opacity": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          Math.min(1, baseOpacity + 0.15),
          baseOpacity,
        ],
      },
    }, beforeId);
  }

  map.addLayer({
    id: FILL_SELECTED_LAYER,
    type: "fill",
    source: sourceId,
    filter: ["==", ["get", "NAME"], selectedName || ""],
    paint: {
      "fill-color": colors.selectedFill,
      "fill-opacity": colors.selectedFillOpacity,
    },
  }, beforeId);

  map.addLayer({
    id: LINE_LAYER,
    type: "line",
    source: sourceId,
    paint: {
      "line-color": colors.line,
      "line-width": 1.1,
      "line-opacity": 0.85,
    },
  }, beforeId);

  map.addLayer({
    id: LINE_SELECTED_LAYER,
    type: "line",
    source: sourceId,
    filter: ["==", ["get", "NAME"], selectedName || ""],
    paint: {
      "line-color": colors.selectedLine,
      "line-width": 2.8,
    },
  }, beforeId);

  if (showLabels) {
    map.addLayer({
      id: LABEL_LAYER,
      type: "symbol",
      source: sourceId,
      minzoom: 8,
      layout: {
        "text-field": ["get", "NAME"],
        "text-size": 11,
        "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
        "text-anchor": "center",
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": colors.label,
        "text-halo-color": colors.halo,
        "text-halo-width": 1.2,
      },
    }, beforeId);
  }

  if (!interactive) return;

  if (map.__municipalityPointerBound) return;
  map.__municipalityPointerBound = true;

  let hoveredName = null;
  const hoverableLayers = [FILL_LAYER, FILL_SELECTED_LAYER, LINE_LAYER].filter((id) =>
    map.getLayer(id)
  );

  const setHover = (name) => {
    if (hoveredName) {
      map.setFeatureState({ source: sourceId, id: hoveredName }, { hover: false });
    }
    hoveredName = name;
    if (hoveredName) {
      map.setFeatureState({ source: sourceId, id: hoveredName }, { hover: true });
      map.getCanvas().style.cursor = "pointer";
    } else {
      map.getCanvas().style.cursor = "";
    }
  };

  hoverableLayers.forEach((layerId) => {
    map.on("mousemove", layerId, (event) => {
      const name = event.features?.[0]?.properties?.NAME;
      if (name !== hoveredName) setHover(name);
    });
    map.on("mouseleave", layerId, () => setHover(null));
    map.on("click", layerId, (event) => {
      const feature = event.features?.[0];
      const name = feature?.properties?.NAME;
      if (!name) return;

      const count = feature.properties?.customerCount;
      if (showPopup) {
        new mapboxgl.Popup({ closeButton: true, maxWidth: "240px" })
          .setLngLat(event.lngLat)
          .setHTML(`
            <div style="padding:4px 2px;min-width:160px">
              <div style="font-weight:700;font-size:15px;margin-bottom:4px;color:#111827">${escapeHtml(name)}</div>
              ${Number.isFinite(count) ? `<div style="font-size:12px;color:#4b5563;margin-bottom:8px">${count.toLocaleString()} clientes solares</div>` : ""}
              <a href="/municipio/${encodeURIComponent(name)}" style="font-size:12px;font-weight:600;color:#1F4298;text-decoration:none">Ver detalles →</a>
            </div>
          `)
          .addTo(map);
      }

      if (onSelect) onSelect(name, event);
    });
  });
}
