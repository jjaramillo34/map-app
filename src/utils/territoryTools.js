import { namesMatch } from "./municipalityBoundaries";

const toNumber = (value) => {
  const parsed = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const pointInRing = (lng, lat, ring = []) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect =
      ((yi > lat) !== (yj > lat)) &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

export const pointInPolygon = (lng, lat, geometry) => {
  if (!geometry) return false;
  if (geometry.type === "Polygon") {
    const [outer, ...holes] = geometry.coordinates || [];
    if (!outer || !pointInRing(lng, lat, outer)) return false;
    return !holes.some((hole) => pointInRing(lng, lat, hole));
  }
  if (geometry.type === "MultiPolygon") {
    return (geometry.coordinates || []).some((polygon) =>
      pointInPolygon(lng, lat, { type: "Polygon", coordinates: polygon })
    );
  }
  return false;
};

export const haversineKm = (lng1, lat1, lng2, lat2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const circlePolygon = (lng, lat, radiusKm, steps = 64) => {
  const coords = [];
  for (let i = 0; i <= steps; i += 1) {
    const angle = (i / steps) * 2 * Math.PI;
    const dLat = (radiusKm / 111.32) * Math.cos(angle);
    const dLng =
      (radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle);
    coords.push([lng + dLng, lat + dLat]);
  }
  return { type: "Polygon", coordinates: [coords] };
};

const featureLngLat = (feature) => {
  const coords = feature?.geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return null;
  return { lng: coords[0], lat: coords[1] };
};

const barrioFromFeature = (feature) => {
  const props = feature?.properties || {};
  return props.City || props.Municipio || "Sin barrio";
};

const municipioFromFeature = (feature, boundaries) => {
  const props = feature?.properties || {};
  const candidates = [
    props.County?.replace(" Municipio", "").trim(),
    props.Municipio,
    props.City,
  ].filter(Boolean);
  const match = (boundaries?.features || []).find((boundary) =>
    candidates.some((candidate) => namesMatch(boundary.properties?.NAME, candidate))
  );
  return match?.properties?.NAME || candidates[0] || "Desconocido";
};

export const customersInGeometry = (features = [], geometry, boundaries) => {
  const matched = features.filter((feature) => {
    const point = featureLngLat(feature);
    return point && pointInPolygon(point.lng, point.lat, geometry);
  });
  return summarizeCustomers(matched, boundaries);
};

export const customersNearPoint = (features = [], lng, lat, radiusKm, boundaries) => {
  const matched = features.filter((feature) => {
    const point = featureLngLat(feature);
    return point && haversineKm(lng, lat, point.lng, point.lat) <= radiusKm;
  });
  return summarizeCustomers(matched, boundaries);
};

export const customersInMunicipio = (features = [], name, boundaries) => {
  const matched = features.filter((feature) => {
    const municipio = municipioFromFeature(feature, boundaries);
    return namesMatch(municipio, name);
  });
  return summarizeCustomers(matched, boundaries);
};

export const summarizeCustomers = (features = [], boundaries) => {
  const groupsMap = new Map();
  features.forEach((feature) => {
    const municipio = municipioFromFeature(feature, boundaries);
    const barrio = barrioFromFeature(feature);
    const key = `${municipio}|||${barrio}`;
    const current = groupsMap.get(key) || { municipio, barrio, count: 0 };
    current.count += 1;
    groupsMap.set(key, current);
  });

  const groups = [...groupsMap.values()].sort((a, b) => b.count - a.count);
  return {
    customers: features.length,
    groups,
    municipioCount: new Set(groups.map((item) => item.municipio)).size,
  };
};

export const visitListCsv = (groups = []) => {
  const header = "Municipio,Barrio,Clientes";
  const rows = groups.map((item) =>
    [item.municipio, item.barrio, item.count]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header, ...rows].join("\n");
};

export const downloadTextFile = (filename, contents, type = "text/csv;charset=utf-8") => {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const fetchDriveIsochrones = async (lng, lat, minutes = [15, 30], token) => {
  const params = new URLSearchParams({
    contours_minutes: minutes.join(","),
    polygons: "true",
    denoise: "1",
    generalize: "50",
    access_token: token,
  });
  const response = await fetch(
    `https://api.mapbox.com/isochrone/v1/mapbox/driving/${lng},${lat}?${params.toString()}`
  );
  if (!response.ok) {
    throw new Error("No se pudo calcular el tiempo de manejo");
  }
  return response.json();
};

export const geocodeLandmark = async (query, proximity, token) => {
  const params = new URLSearchParams({
    access_token: token,
    limit: "1",
    language: "es",
    bbox: "-67.95,17.85,-65.22,18.52",
  });
  if (proximity) {
    params.set("proximity", `${proximity.lng},${proximity.lat}`);
  }
  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params.toString()}`
  );
  if (!response.ok) return null;
  const data = await response.json();
  const center = data.features?.[0]?.center;
  if (!center) return null;
  return { lng: center[0], lat: center[1], placeName: data.features[0].place_name };
};

export const joinMetricsToBoundaries = (boundaries, municipios = []) => ({
  type: "FeatureCollection",
  features: (boundaries?.features || []).map((feature) => {
    const name = feature.properties?.NAME;
    const stats =
      municipios.find((item) => namesMatch(item.name, name)) || {};
    return {
      ...feature,
      properties: {
        ...feature.properties,
        customerCount: stats.customers || 0,
        gapScore: stats.gapScore || 0,
        avgIncome: stats.avgIncome || 0,
        penetrationRate: toNumber(stats.penetrationRate),
        bivariateClass: stats.bivariateClass || "underserved",
      },
    };
  }),
});
