import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import {
  BookmarkPlus,
  Download,
  FileText,
  Loader2,
  MapPin,
  Navigation,
  Satellite,
  Timer,
  Trophy,
  Users,
} from "lucide-react";
import Layout from "../components/Layout";
import geoJson from "../data/geojson.geojson";
import { getAllMunicipalityData } from "../services/municipalityData";
import { getAdminSession } from "../services/adminAuth";
import { saveVisitList } from "../services/visitLists";
import {
  addMunicipalityBoundaryLayers,
  fitMapToMunicipality,
  getFeatureBounds,
  highlightMunicipalities,
  loadMunicipalityBoundaries,
  namesMatch,
  resolveGeoJson,
  setMunicipalityFillColor,
} from "../utils/municipalityBoundaries";
import {
  aggregateMunicipalityStats,
  assignBivariateClasses,
  BIVARIATE_CLASSES,
  BIVARIATE_FILL_EXPRESSION,
  computeGapScores,
  GAP_FILL_EXPRESSION,
  mergeMunicipalityProfiles,
  municipioPath,
} from "../utils/analyticsInsights";
import {
  circlePolygon,
  customersInGeometry,
  customersInMunicipio,
  customersNearPoint,
  downloadTextFile,
  fetchDriveIsochrones,
  geocodeLandmark,
  joinMetricsToBoundaries,
  visitListCsv,
} from "../utils/territoryTools";
import { downloadMunicipioVisitSheet } from "../utils/visitPdf";
import { normalizePoi, poiLabel } from "../utils/municipalityProfile";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

const LIGHT_STYLE = "mapbox://styles/mapbox/light-v10";
const SATELLITE_STYLE = "mapbox://styles/mapbox/satellite-streets-v12";
const NEARBY_KM = 5;

const defaultVisitListName = () => {
  const now = new Date();
  return `Ruta ${now.toLocaleDateString("es-PR", { day: "numeric", month: "short" })}`;
};

const OpportunityMap = () => {
  const [searchParams] = useSearchParams();
  const mapNode = useRef(null);
  const map = useRef(null);
  const draw = useRef(null);
  const toolRef = useRef("inspect");
  const municipiosRef = useRef([]);
  const pointsRef = useRef([]);
  const boundariesRef = useRef(null);
  const geocodeCache = useRef(new Map());
  const paintBoundariesRef = useRef(() => {});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [municipios, setMunicipios] = useState([]);
  const [boundaryData, setBoundaryData] = useState(null);
  const [layerMode, setLayerMode] = useState("gap");
  const [satellite, setSatellite] = useState(false);
  const [tool, setTool] = useState("inspect");
  const [selectedName, setSelectedName] = useState("");
  const [compareNames, setCompareNames] = useState(["", ""]);
  const [territory, setTerritory] = useState(null);
  const [origin, setOrigin] = useState(null);
  const [isochroneCounts, setIsochroneCounts] = useState(null);
  const [nearby, setNearby] = useState(null);
  const [geoStatus, setGeoStatus] = useState("");
  const [poiStatus, setPoiStatus] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [listName, setListName] = useState(defaultVisitListName);
  const [savingList, setSavingList] = useState(false);
  const [listMessage, setListMessage] = useState("");

  toolRef.current = tool;
  municipiosRef.current = municipios;

  const selected = useMemo(
    () => municipios.find((item) => namesMatch(item.name, selectedName)),
    [municipios, selectedName]
  );
  const comparePair = useMemo(
    () =>
      compareNames
        .map((name) => municipios.find((item) => namesMatch(item.name, name)))
        .filter(Boolean),
    [compareNames, municipios]
  );

  const fillExpression = layerMode === "bivariate" ? BIVARIATE_FILL_EXPRESSION : GAP_FILL_EXPRESSION;
  const fillOpacity = satellite ? 0.58 : 0.62;

  const applyFill = useCallback(() => {
    if (!map.current) return;
    setMunicipalityFillColor(map.current, fillExpression, fillOpacity);
  }, [fillExpression, fillOpacity]);

  const setIsochroneData = (collection) => {
    if (!map.current) return;
    const source = map.current.getSource("opp-isochrone");
    const empty = { type: "FeatureCollection", features: [] };
    if (source) source.setData(collection || empty);
  };

  const setNearbyData = (geometry, center) => {
    if (!map.current) return;
    const area = map.current.getSource("opp-nearby");
    const originSource = map.current.getSource("opp-origin");
    if (area) {
      area.setData(
        geometry
          ? { type: "FeatureCollection", features: [{ type: "Feature", geometry, properties: {} }] }
          : { type: "FeatureCollection", features: [] }
      );
    }
    if (originSource) {
      originSource.setData(
        center
          ? {
              type: "FeatureCollection",
              features: [{ type: "Feature", geometry: { type: "Point", coordinates: [center.lng, center.lat] }, properties: {} }],
            }
          : { type: "FeatureCollection", features: [] }
      );
    }
  };

  const setPoiData = (features) => {
    if (!map.current) return;
    const source = map.current.getSource("opp-pois");
    if (source) {
      source.setData({ type: "FeatureCollection", features: features || [] });
    }
  };

  const addOverlayLayers = () => {
    if (!map.current) return;

    if (!map.current.getSource("opp-isochrone")) {
      map.current.addSource("opp-isochrone", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.current.addLayer({
        id: "opp-isochrone-fill",
        type: "fill",
        source: "opp-isochrone",
        paint: {
          "fill-color": ["match", ["get", "contour"], 15, "#facc15", "#fb923c"],
          "fill-opacity": 0.22,
        },
      });
      map.current.addLayer({
        id: "opp-isochrone-line",
        type: "line",
        source: "opp-isochrone",
        paint: {
          "line-color": ["match", ["get", "contour"], 15, "#ca8a04", "#c2410c"],
          "line-width": 2,
        },
      });
    }

    if (!map.current.getSource("opp-nearby")) {
      map.current.addSource("opp-nearby", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.current.addLayer({
        id: "opp-nearby-fill",
        type: "fill",
        source: "opp-nearby",
        paint: { "fill-color": "#2563eb", "fill-opacity": 0.12 },
      });
      map.current.addLayer({
        id: "opp-nearby-line",
        type: "line",
        source: "opp-nearby",
        paint: { "line-color": "#1d4ed8", "line-width": 2, "line-dasharray": [2, 1] },
      });
    }

    if (!map.current.getSource("opp-origin")) {
      map.current.addSource("opp-origin", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.current.addLayer({
        id: "opp-origin-circle",
        type: "circle",
        source: "opp-origin",
        paint: {
          "circle-radius": 7,
          "circle-color": "#1F4298",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });
    }

    if (!map.current.getSource("opp-pois")) {
      map.current.addSource("opp-pois", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.current.addLayer({
        id: "opp-pois-circle",
        type: "circle",
        source: "opp-pois",
        paint: {
          "circle-radius": 6,
          "circle-color": "#e11d48",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });
    }

    if (!map.current.__poiClickBound && map.current.getLayer("opp-pois-circle")) {
      map.current.__poiClickBound = true;
      map.current.on("click", "opp-pois-circle", (event) => {
        const title = event.features?.[0]?.properties?.title;
        if (!title) return;
        new mapboxgl.Popup({ closeButton: true })
          .setLngLat(event.lngLat)
          .setText(title)
          .addTo(map.current);
      });
      map.current.on("mouseenter", "opp-pois-circle", () => {
        map.current.getCanvas().style.cursor = "pointer";
      });
      map.current.on("mouseleave", "opp-pois-circle", () => {
        map.current.getCanvas().style.cursor = "";
      });
    }
  };

  const paintBoundaries = useCallback(() => {
    if (!map.current || !boundaryData) return;
    addMunicipalityBoundaryLayers(map.current, {
      data: boundaryData,
      theme: satellite ? "dark" : "light",
      interactive: true,
      showFill: true,
      showPopup: false,
      fillColorExpression: fillExpression,
      fillOpacity,
      onSelect: (name) => {
        if (toolRef.current === "draw" || toolRef.current === "isochrone") return;
        if (toolRef.current === "compare") {
          setCompareNames((current) => {
            if (!current[0] || current[0] === name) return [name, current[1]];
            if (!current[1] || current[1] === name) return [current[0], name];
            return [current[1], name];
          });
          return;
        }
        setSelectedName(name);
        setTerritory({
          ...customersInMunicipio(pointsRef.current, name, boundariesRef.current),
          source: "municipio",
        });
      },
    });
    applyFill();
    addOverlayLayers();
  }, [applyFill, boundaryData, fillExpression, fillOpacity, satellite]);
  paintBoundariesRef.current = paintBoundaries;

  useEffect(() => {
    const load = async () => {
      try {
        const [points, boundaries, profiles] = await Promise.all([
          resolveGeoJson(geoJson),
          loadMunicipalityBoundaries(),
          getAllMunicipalityData().catch(() => ({})),
        ]);
        const stats = assignBivariateClasses(
          computeGapScores(aggregateMunicipalityStats(points.features || []))
        );
        const withProfiles = mergeMunicipalityProfiles(stats, profiles);
        const joined = joinMetricsToBoundaries(boundaries, withProfiles);
        pointsRef.current = points.features || [];
        boundariesRef.current = joined;
        setMunicipios(withProfiles);
        setBoundaryData(joined);
        setLoading(false);
      } catch (loadError) {
        console.error("[OpportunityMap] load error", loadError);
        setError("No se pudieron cargar los datos del mapa");
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    getAdminSession()
      .then((session) => setIsAdmin(Boolean(session)))
      .catch(() => setIsAdmin(false));
  }, []);

  useEffect(() => {
    const requested = searchParams.get("municipio");
    if (requested && municipios.length) {
      const match = municipios.find((item) => namesMatch(item.name, requested));
      if (match) setSelectedName(match.name);
    }
  }, [municipios, searchParams]);

  useEffect(() => {
    if (!mapNode.current || map.current || !boundaryData) return;

    const mapInstance = new mapboxgl.Map({
      container: mapNode.current,
      style: satellite ? SATELLITE_STYLE : LIGHT_STYLE,
      center: [-66.43, 18.22],
      zoom: 8.4,
    });
    map.current = mapInstance;

    mapInstance.addControl(new mapboxgl.NavigationControl(), "bottom-right");
    mapInstance.addControl(new mapboxgl.FullscreenControl(), "bottom-right");
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl,
      marker: false,
      placeholder: "Oficina, plaza o dirección",
      proximity: { longitude: -66.43, latitude: 18.22 },
      countries: "pr",
    });
    mapInstance.addControl(geocoder, "top-left");
    geocoder.on("result", (event) => {
      const [lng, lat] = event.result.center || [];
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
      const nextOrigin = { lng, lat };
      setOrigin(nextOrigin);
      if (toolRef.current === "nearby") {
        const geometry = circlePolygon(lng, lat, NEARBY_KM);
        setNearbyData(geometry, nextOrigin);
        const summary = customersNearPoint(
          pointsRef.current,
          lng,
          lat,
          NEARBY_KM,
          boundariesRef.current
        );
        setNearby(summary);
        setTerritory({ ...summary, source: "nearby" });
      }
    });

    const drawControl = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: true, trash: true },
    });
    draw.current = drawControl;
    mapInstance.addControl(drawControl, "top-right");

    const onDraw = () => {
      const features = drawControl.getAll().features.filter((feature) => feature.geometry?.type === "Polygon" || feature.geometry?.type === "MultiPolygon");
      if (!features.length) {
        setTerritory(null);
        return;
      }
      const summary = customersInGeometry(pointsRef.current, features[0].geometry, boundariesRef.current);
      setTerritory({ ...summary, source: "polygon" });
      setTool("draw");
    };

    mapInstance.on("draw.create", onDraw);
    mapInstance.on("draw.update", onDraw);
    mapInstance.on("draw.delete", () => setTerritory(null));

    mapInstance.on("load", () => paintBoundariesRef.current());
    mapInstance.on("style.load", () => {
      const saved = draw.current?.getAll?.();
      paintBoundariesRef.current();
      if (draw.current && saved?.features?.length) {
        try {
          draw.current.set(saved);
        } catch (restoreError) {
          console.warn("[OpportunityMap] could not restore drawing", restoreError);
        }
      }
    });

    mapInstance.on("click", (event) => {
      if (toolRef.current !== "isochrone") return;
      if (event.defaultPrevented) return;
      setOrigin({ lng: event.lngLat.lng, lat: event.lngLat.lat });
    });

    return () => {
      mapInstance.remove();
      map.current = null;
    };
    // Initialize once when data is ready.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boundaryData]);

  useEffect(() => {
    applyFill();
  }, [applyFill]);

  useEffect(() => {
    if (!map.current || !boundaryData) return;
    highlightMunicipalities(
      map.current,
      tool === "compare" ? compareNames.filter(Boolean) : selectedName ? [selectedName] : []
    );
    if (tool !== "compare" && selectedName) {
      fitMapToMunicipality(map.current, boundaryData, selectedName);
    }
    if (tool === "compare" && comparePair.length === 2) {
      const bounds = getFeatureBounds(
        boundaryData.features.find((feature) => namesMatch(feature.properties?.NAME, comparePair[0].name))
      );
      const second = boundaryData.features.find((feature) =>
        namesMatch(feature.properties?.NAME, comparePair[1].name)
      );
      if (second) {
        const extra = getFeatureBounds(second);
        bounds.extend(extra.getSouthWest());
        bounds.extend(extra.getNorthEast());
      }
      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, { padding: 80, duration: 800, maxZoom: 11 });
      }
    }
  }, [boundaryData, compareNames, comparePair, selectedName, tool]);

  useEffect(() => {
    if (!map.current) return;
    const styleUrl = map.current.getStyle()?.sprite || "";
    const wantsSatellite = satellite;
    const isSatellite = styleUrl.includes("satellite");
    if (wantsSatellite === isSatellite) return;
    map.current.setStyle(wantsSatellite ? SATELLITE_STYLE : LIGHT_STYLE);
  }, [satellite]);

  useEffect(() => {
    const loadPois = async () => {
      if (!selected || !map.current) {
        setPoiData([]);
        return;
      }
      const centerFeature = boundaryData?.features?.find((feature) =>
        namesMatch(feature.properties?.NAME, selected.name)
      );
      const bounds = centerFeature ? getFeatureBounds(centerFeature) : null;
      const proximity = bounds && !bounds.isEmpty() ? bounds.getCenter() : { lng: -66.43, lat: 18.22 };
      const landmarks = (selected.pointsOfInterest || []).slice(0, 5);
      if (!landmarks.length) {
        setPoiData([]);
        setPoiStatus("");
        return;
      }
      setPoiStatus("Buscando puntos de interés…");
      const features = [];
      for (const landmark of landmarks) {
        const poi = normalizePoi(landmark);
        if (!poi) continue;
        const label = poiLabel(poi);
        if (Number.isFinite(poi.lat) && Number.isFinite(poi.lng)) {
          features.push({
            type: "Feature",
            geometry: { type: "Point", coordinates: [poi.lng, poi.lat] },
            properties: { title: label },
          });
          continue;
        }
        const cacheKey = `${selected.name}:${poi.name}`;
        let result = geocodeCache.current.get(cacheKey);
        if (!result) {
          result = await geocodeLandmark(
            `${poi.name}, ${selected.name}, Puerto Rico`,
            proximity,
            mapboxgl.accessToken
          );
          if (result) geocodeCache.current.set(cacheKey, result);
        }
        if (result) {
          features.push({
            type: "Feature",
            geometry: { type: "Point", coordinates: [result.lng, result.lat] },
            properties: { title: label },
          });
        }
      }
      setPoiData(features);
      setPoiStatus(features.length ? `${features.length} puntos de interés en el mapa` : "No se pudieron ubicar los puntos de interés");
    };
    loadPois();
  }, [boundaryData, selected]);

  useEffect(() => {
    const runIsochrone = async () => {
      if (!origin || !mapboxgl.accessToken) return;
      setGeoStatus("Calculando 15 y 30 minutos…");
      try {
        const data = await fetchDriveIsochrones(origin.lng, origin.lat, [15, 30], mapboxgl.accessToken);
        setIsochroneData(data);
        setNearbyData(null, origin);
        const counts = (data.features || []).map((feature) => {
          const minutes = feature.properties?.contour;
          const summary = customersInGeometry(pointsRef.current, feature.geometry, boundariesRef.current);
          return { minutes, ...summary };
        });
        setIsochroneCounts(counts);
        const selectedBand = counts.find((item) => item.minutes === 15) || counts[0] || null;
        setTerritory(selectedBand ? { ...selectedBand, source: "isochrone" } : null);
        setGeoStatus("");
      } catch (isochroneError) {
        console.error(isochroneError);
        setGeoStatus(isochroneError.message);
      }
    };
    if (tool === "isochrone" && origin) runIsochrone();
  }, [origin, tool]);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus("Este navegador no permite geolocalización");
      return;
    }
    setGeoStatus("Obteniendo ubicación…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const center = { lng: position.coords.longitude, lat: position.coords.latitude };
        setOrigin(center);
        map.current?.flyTo({ center: [center.lng, center.lat], zoom: 11 });
        if (tool === "nearby" || tool === "inspect") {
          const geometry = circlePolygon(center.lng, center.lat, NEARBY_KM);
          setNearbyData(geometry, center);
          const summary = customersNearPoint(
            pointsRef.current,
            center.lng,
            center.lat,
            NEARBY_KM,
            boundariesRef.current
          );
          setNearby(summary);
          setTerritory({ ...summary, source: "nearby" });
          setTool("nearby");
        }
        setGeoStatus("");
      },
      () => setGeoStatus("No se pudo obtener la ubicación"),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const downloadList = () => {
    if (!territory?.groups?.length) return;
    downloadTextFile(
      `lista-visitas-${new Date().toISOString().slice(0, 10)}.csv`,
      visitListCsv(territory.groups)
    );
  };

  const saveCurrentList = async () => {
    if (!territory?.groups?.length) return;
    const name = listName.trim() || defaultVisitListName();
    setSavingList(true);
    setListMessage("");
    try {
      await saveVisitList({
        name,
        source: territory.source || tool,
        groups: territory.groups,
        customers: territory.customers,
      });
      setListMessage(`Guardada: ${name}`);
    } catch (saveError) {
      setListMessage(saveError.message || "No se pudo guardar la ruta");
    } finally {
      setSavingList(false);
    }
  };

  const toolButton = (id, label, Icon) => (
    <button
      key={id}
      type="button"
      onClick={() => setTool(id)}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${
        tool === id ? "bg-primary-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );

  return (
    <Layout showFooter={false}>
      <div className="relative h-[calc(100vh-76px)] bg-gray-100">
        <div ref={mapNode} className="absolute inset-0" />

        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-3 p-3 md:flex-row md:items-start md:justify-between">
          <div className="pointer-events-auto max-w-xl space-y-2 rounded-2xl border border-white/70 bg-white/95 p-3 shadow-xl backdrop-blur">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Mapa de oportunidad</h1>
              <p className="text-xs text-gray-500">
                Score de brecha, territorio de visitas y tiempo de manejo. Las listas agrupan por barrio, no por dirección.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setLayerMode("gap")}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${layerMode === "gap" ? "bg-orange-500 text-white" : "bg-orange-50 text-orange-800"}`}
              >
                Score de oportunidad
              </button>
              <button
                type="button"
                onClick={() => setLayerMode("bivariate")}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${layerMode === "bivariate" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-800"}`}
              >
                Ingreso × solar
              </button>
              <button
                type="button"
                onClick={() => setSatellite((value) => !value)}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium ${satellite ? "bg-emerald-700 text-white" : "bg-emerald-50 text-emerald-800"}`}
              >
                <Satellite className="h-4 w-4" />
                Satélite
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {toolButton("inspect", "Seleccionar", MapPin)}
              {toolButton("draw", "Territorio", Users)}
              {toolButton("isochrone", "15 / 30 min", Timer)}
              {toolButton("nearby", "Cerca de mí", Navigation)}
              {toolButton("compare", "Comparar", Trophy)}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={useMyLocation}
                className="rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-800"
              >
                Usar mi ubicación
              </button>
              {tool === "isochrone" && (
                <span className="self-center text-xs text-gray-500">Haz clic en el mapa o busca una plaza/oficina</span>
              )}
              {tool === "draw" && (
                <span className="self-center text-xs text-gray-500">Dibuja un polígono con el control de la esquina</span>
              )}
            </div>
            {geoStatus && <p className="text-xs text-amber-700">{geoStatus}</p>}
            {layerMode === "bivariate" && (
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                {Object.values(BIVARIATE_CLASSES).map((item) => (
                  <div key={item.id} className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm" style={{ background: item.color }} />
                    {item.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pointer-events-auto w-full max-w-md space-y-3 rounded-2xl border border-white/70 bg-white/95 p-4 shadow-xl backdrop-blur md:max-h-[calc(100vh-110px)] md:overflow-y-auto">
            {tool === "compare" ? (
              <div className="space-y-3">
                <h2 className="font-bold text-gray-900">Comparar en el mapa</h2>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {compareNames.map((name, index) => (
                    <select
                      key={index}
                      value={name}
                      onChange={(event) => {
                        const next = [...compareNames];
                        next[index] = event.target.value;
                        setCompareNames(next);
                      }}
                      className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
                    >
                      <option value="">Municipio {index + 1}</option>
                      {municipios.map((item) => (
                        <option key={item.name} value={item.name}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  ))}
                </div>
                {comparePair.length === 2 ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {comparePair.map((item) => (
                      <MunicipioCard
                        key={item.name}
                        municipio={item}
                        onPdf={() => downloadMunicipioVisitSheet(item)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Elige dos municipios o haz clic en el mapa.</p>
                )}
              </div>
            ) : selected ? (
              <MunicipioCard
                municipio={selected}
                poiStatus={poiStatus}
                onPdf={() => downloadMunicipioVisitSheet(selected)}
                onUseTerritory={() => {
                  const summary = customersInMunicipio(pointsRef.current, selected.name, boundariesRef.current);
                  setTerritory({ ...summary, source: "municipio" });
                }}
              />
            ) : (
              <div>
                <h2 className="font-bold text-gray-900">Elige un municipio</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Haz clic en el mapa para ver el score, la historia de Gemini y descargar la ficha de visita.
                </p>
              </div>
            )}

            {territory && (
              <div className="rounded-xl border border-primary-100 bg-primary-50/70 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-gray-900">Lista de visitas</h3>
                  <button
                    type="button"
                    onClick={downloadList}
                    className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-xs font-semibold text-primary-800"
                  >
                    <Download className="h-3.5 w-3.5" />
                    CSV
                  </button>
                </div>
                <p className="text-sm text-gray-700">
                  <span className="font-bold">{territory.customers.toLocaleString()}</span> clientes en{" "}
                  {territory.municipioCount} municipio{territory.municipioCount === 1 ? "" : "s"}
                </p>
                {isochroneCounts?.length > 0 && tool === "isochrone" && (
                  <div className="mt-2 flex gap-2 text-xs">
                    {isochroneCounts.map((item) => (
                      <span key={item.minutes} className="rounded-full bg-white px-2 py-1 font-medium">
                        {item.minutes} min: {item.customers.toLocaleString()}
                      </span>
                    ))}
                  </div>
                )}
                {nearby && tool === "nearby" && (
                  <p className="mt-1 text-xs text-gray-500">Radio de {NEARBY_KM} km desde tu ubicación</p>
                )}
                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs">
                  {territory.groups.slice(0, 12).map((group) => (
                    <li key={`${group.municipio}-${group.barrio}`} className="flex justify-between gap-2">
                      <span className="text-gray-700">
                        {group.barrio}
                        <span className="text-gray-400"> · {group.municipio}</span>
                      </span>
                      <span className="font-semibold">{group.count}</span>
                    </li>
                  ))}
                </ul>
                {isAdmin ? (
                  <div className="mt-3 flex flex-col gap-2">
                    <input
                      type="text"
                      value={listName}
                      onChange={(event) => setListName(event.target.value)}
                      placeholder="Ruta Sur, 26 ago"
                      className="w-full rounded-lg border border-primary-200 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      type="button"
                      onClick={saveCurrentList}
                      disabled={savingList || !territory.groups.length}
                      className="inline-flex items-center justify-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {savingList ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <BookmarkPlus className="h-3.5 w-3.5" />
                      )}
                      {savingList ? "Guardando…" : "Guardar ruta"}
                    </button>
                    {listMessage ? (
                      <p className="text-xs text-primary-800">{listMessage}</p>
                    ) : (
                      <p className="text-xs text-gray-500">
                        Queda en admin → Rutas. Agrupa por municipio y barrio, sin direcciones.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-gray-500">
                    Inicia sesión en admin para guardar esta lista como ruta.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

const MunicipioCard = ({ municipio, poiStatus, onPdf, onUseTerritory }) => (
  <div className="space-y-3">
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">Municipio</p>
        <h2 className="text-xl font-bold text-gray-900">{municipio.name}</h2>
      </div>
      <span className="rounded-full bg-orange-100 px-2.5 py-1 text-sm font-bold text-orange-800">
        {municipio.gapScore}
      </span>
    </div>
    <div className="grid grid-cols-2 gap-2 text-sm">
      <Stat label="Clientes" value={municipio.customers.toLocaleString()} />
      <Stat label="Penetración" value={`${municipio.penetrationRate}%`} />
      <Stat label="Ingreso" value={`$${municipio.avgIncome.toLocaleString()}`} />
      <Stat label="Mercado" value={BIVARIATE_CLASSES[municipio.bivariateClass]?.label || "—"} />
    </div>
    {municipio.solarOpportunity ? (
      <p className="text-sm leading-relaxed text-gray-700">{municipio.solarOpportunity}</p>
    ) : (
      <p className="text-sm text-gray-400">Sin oportunidad solar de Gemini todavía.</p>
    )}
    {municipio.salesNotes ? (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">
          Notas de ventas
        </p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-amber-950">{municipio.salesNotes}</p>
      </div>
    ) : null}
    {municipio.pointsOfInterest?.length > 0 && (
      <ul className="space-y-1 text-xs text-gray-600">
        {municipio.pointsOfInterest.slice(0, 4).map((place, index) => {
          const label = poiLabel(place);
          return (
            <li key={`${label}-${index}`} className="flex items-start gap-1">
              <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-rose-500" />
              {label}
            </li>
          );
        })}
      </ul>
    )}
    {poiStatus ? <p className="text-xs text-gray-400">{poiStatus}</p> : null}
    <div className="flex flex-wrap gap-2">
      <Link
        to={municipioPath(municipio.name)}
        className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white"
      >
        Ver detalle
      </Link>
      <button
        type="button"
        onClick={onPdf}
        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-800"
      >
        <FileText className="h-4 w-4" />
        Ficha PDF
      </button>
      {onUseTerritory && (
        <button
          type="button"
          onClick={onUseTerritory}
          className="rounded-lg border border-primary-200 px-3 py-1.5 text-sm font-semibold text-primary-800"
        >
          Usar como territorio
        </button>
      )}
    </div>
  </div>
);

const Stat = ({ label, value }) => (
  <div className="rounded-lg bg-gray-50 px-2.5 py-2">
    <p className="text-[11px] text-gray-500">{label}</p>
    <p className="font-semibold text-gray-900">{value}</p>
  </div>
);

export default OpportunityMap;
