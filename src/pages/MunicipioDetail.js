import React, { useRef, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import geoJson from "../data/geojson.geojson";
import Layout from "../components/Layout";
import {
  addMunicipalityBoundaryLayers,
  findMunicipalityFeature,
  fitMapToMunicipality,
  highlightMunicipality,
  loadMunicipalityBoundaries,
} from "../utils/municipalityBoundaries";
import {
  MapPin,
  Users,
  DollarSign,
  TrendingUp,
  BarChart3,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Zap,
  Target,
  Building2,
  Home,
  FileText,
  Sparkles,
  CheckCircle2,
  Lightbulb,
  BookOpen,
  Calendar,
} from "lucide-react";
import { getMunicipalityData } from "../services/municipalityData";
import { normalizePoi } from "../utils/municipalityProfile";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

const formatUpdatedAt = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("es-PR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const descriptionParagraphs = (description) =>
  description
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

const MunicipioDetail = () => {
  const { municipioName } = useParams();
  const map = useRef(null);
  const [mapNode, setMapNode] = useState(null);
  const [municipioData, setMunicipioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [extraData, setExtraData] = useState(null);
  const [mapStatus, setMapStatus] = useState("loading");
  const [boundaries, setBoundaries] = useState(null);

  // Decode municipality name from URL
  const decodedName = municipioName ? decodeURIComponent(municipioName) : "";

  useEffect(() => {
    loadMunicipalityBoundaries()
      .then(setBoundaries)
      .catch((error) => console.error("[MunicipioDetail] Error loading boundaries:", error));
  }, []);

  // Load geojson data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setExtraData(null);
        setMapStatus("loading");
        let dataToLoad = geoJson;
        
        // If it's a URL string, fetch it
        if (typeof dataToLoad === 'string' && (dataToLoad.startsWith('/') || dataToLoad.startsWith('http'))) {
          const response = await fetch(dataToLoad);
          dataToLoad = await response.json();
        } else if (typeof dataToLoad === 'string') {
          try {
            dataToLoad = JSON.parse(dataToLoad);
          } catch (e) {
            console.error("[MunicipioDetail] Failed to parse geojson:", e);
          }
        }
        
        // Process municipality data
        if (dataToLoad && dataToLoad.features) {
          processMunicipioData(dataToLoad.features, decodedName);
        }
      } catch (error) {
        console.error("[MunicipioDetail] Error loading geojson:", error);
        setError("Error al cargar los datos del municipio");
        setLoading(false);
      }
    };
    
    loadData();
  }, [decodedName]);

  // Process municipality-specific data
  const processMunicipioData = (features, municipioName) => {
    if (!municipioName) {
      setError("Nombre de municipio no válido");
      setLoading(false);
      return;
    }

    // Filter features for this municipality
    const municipioFeatures = features.filter((feature) => {
      const props = feature.properties || {};
      const county = props.County ? props.County.replace(" Municipio", "").trim() : "";
      const city = props.City || "";
      const municipio = props.Municipio || "";
      
      return (
        county.toLowerCase() === municipioName.toLowerCase() ||
        city.toLowerCase() === municipioName.toLowerCase() ||
        municipio.toLowerCase() === municipioName.toLowerCase()
      );
    });

    if (municipioFeatures.length === 0) {
      setError(`No se encontraron datos para el municipio "${municipioName}"`);
      setLoading(false);
      return;
    }

    // Calculate statistics
    let totalCustomers = 0;
    let totalIncome = 0;
    let incomeCount = 0;
    let totalPopulation = 0;
    let populationCount = 0;
    let totalPoverty = 0;
    let povertyCount = 0;
    let totalUnemployment = 0;
    let unemploymentCount = 0;
    let totalProfessional = 0;
    let professionalCount = 0;
    const coordinates = [];

    municipioFeatures.forEach((feature) => {
      totalCustomers++;
      const props = feature.properties || {};
      
      const income = props.Income || props.IncomePerCap || 0;
      const population = props.TotalPop || props.Population || 0;
      const poverty = props.Poverty || 0;
      const unemployment = props.Unemployment || 0;
      const professional = props.Professional || 0;

      if (income > 0) {
        totalIncome += income;
        incomeCount++;
      }
      if (population > 0) {
        totalPopulation += population;
        populationCount++;
      }
      if (poverty > 0) {
        totalPoverty += poverty;
        povertyCount++;
      }
      if (unemployment > 0) {
        totalUnemployment += unemployment;
        unemploymentCount++;
      }
      if (professional > 0) {
        totalProfessional += professional;
        professionalCount++;
      }

      if (feature.geometry?.coordinates) {
        const [lng, lat] = feature.geometry.coordinates;
        coordinates.push({ lng, lat });
      }
    });

    const avgIncome = incomeCount > 0 ? totalIncome / incomeCount : 0;
    const avgPopulation = populationCount > 0 ? totalPopulation / populationCount : 0;
    const avgPoverty = povertyCount > 0 ? totalPoverty / povertyCount : 0;
    const avgUnemployment = unemploymentCount > 0 ? totalUnemployment / unemploymentCount : 0;
    const avgProfessional = professionalCount > 0 ? totalProfessional / professionalCount : 0;
    const penetrationRate = avgPopulation > 0 ? (totalCustomers / avgPopulation) * 100 : 0;

    // Calculate center point
    let centerLng = -66.5901;
    let centerLat = 18.2208;
    if (coordinates.length > 0) {
      centerLng = coordinates.reduce((sum, c) => sum + c.lng, 0) / coordinates.length;
      centerLat = coordinates.reduce((sum, c) => sum + c.lat, 0) / coordinates.length;
    }

    const municipioInfo = {
      name: municipioName,
      customers: totalCustomers,
      avgIncome: Math.round(avgIncome),
      avgPopulation: Math.round(avgPopulation),
      avgPoverty: parseFloat(avgPoverty.toFixed(1)),
      avgUnemployment: parseFloat(avgUnemployment.toFixed(1)),
      avgProfessional: parseFloat(avgProfessional.toFixed(1)),
      penetrationRate: parseFloat(penetrationRate.toFixed(2)),
      coordinates,
      center: { lng: centerLng, lat: centerLat },
      features: municipioFeatures,
    };

    setMunicipioData(municipioInfo);
    setStats(municipioInfo);
    setExtraData(null);
    setLoading(false);

    // Load extra data (descriptions, etc.) from MongoDB without blocking the map.
    getMunicipalityData(municipioName)
      .then((extra) => {
        setExtraData(extra);
      })
      .catch((error) => {
        console.error('Error loading municipality extra data:', error);
        setExtraData(null);
      });
  };

  // Initialize map once the detail view (and map container) are in the DOM.
  useEffect(() => {
    if (!mapNode || !municipioData) return;

    setMapStatus("loading");
    let mapLoaded = false;
    let mapLoadTimeout;
    let mapInstance;

    try {
      if (!mapboxgl.accessToken) {
        setMapStatus("error");
        return undefined;
      }

      mapInstance = new mapboxgl.Map({
        container: mapNode,
        style: "mapbox://styles/mapbox/light-v10",
        center: [municipioData.center.lng, municipioData.center.lat],
        zoom: 12,
        bearing: 0,
        pitch: 0,
      });
      map.current = mapInstance;

      mapInstance.addControl(new mapboxgl.NavigationControl(), "top-right");
      mapInstance.addControl(new mapboxgl.FullscreenControl(), "top-right");
      mapInstance.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true,
          },
          trackUserLocation: true,
          showAccuracyCircle: false,
        }),
        "top-right"
      );

      mapInstance.on("load", () => {
        try {
          mapInstance.resize();

          const selectedFeature = findMunicipalityFeature(boundaries, municipioData.name);
          const officialName = selectedFeature?.properties?.NAME;
          if (boundaries?.features?.length) {
            addMunicipalityBoundaryLayers(mapInstance, {
              data: boundaries,
              theme: "light",
              interactive: false,
              selectedName: officialName,
            });
            if (officialName) {
              highlightMunicipality(mapInstance, officialName);
              fitMapToMunicipality(mapInstance, boundaries, officialName);
            }
          }

          if (municipioData.features?.length) {
            const filteredGeoJson = {
              type: "FeatureCollection",
              features: municipioData.features,
            };

            mapInstance.addSource("municipio-data", {
              type: "geojson",
              data: filteredGeoJson,
              cluster: true,
              clusterMaxZoom: 14,
              clusterRadius: 50,
            });

            mapInstance.addLayer({
              id: "municipio-clusters",
              type: "circle",
              source: "municipio-data",
              filter: ["has", "point_count"],
              paint: {
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

            mapInstance.addLayer({
              id: "municipio-cluster-count",
              type: "symbol",
              source: "municipio-data",
              filter: ["has", "point_count"],
              layout: {
                "text-field": "{point_count_abbreviated}",
                "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
                "text-size": 12,
              },
            });

            mapInstance.addLayer({
              id: "municipio-points",
              type: "circle",
              source: "municipio-data",
              filter: ["!", ["has", "point_count"]],
              paint: {
                "circle-color": "#FF6800",
                "circle-radius": 6,
                "circle-stroke-width": 1,
                "circle-stroke-color": "#fff",
              },
            });

            mapInstance.on("click", "municipio-clusters", (e) => {
              const features = mapInstance.queryRenderedFeatures(e.point, {
                layers: ["municipio-clusters"],
              });
              const clusterId = features[0].properties.cluster_id;
              const source = mapInstance.getSource("municipio-data");

              source.getClusterExpansionZoom(clusterId, (err, zoom) => {
                if (err) return;

                mapInstance.easeTo({
                  center: features[0].geometry.coordinates,
                  zoom,
                });
              });
            });

            mapInstance.on("click", "municipio-points", (e) => {
              const props = e.features[0].properties;
              new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(`
                  <div class="p-3">
                    <h3 class="font-bold text-lg mb-2">${municipioData.name}</h3>
                    <div class="space-y-1 text-sm">
                      ${props.Income ? `<p><strong>Ingreso:</strong> $${parseInt(props.Income).toLocaleString()}</p>` : ""}
                      ${props.TotalPop ? `<p><strong>Población:</strong> ${parseInt(props.TotalPop).toLocaleString()}</p>` : ""}
                      ${props.City ? `<p><strong>Ciudad:</strong> ${props.City}</p>` : ""}
                    </div>
                  </div>
                `)
                .addTo(mapInstance);
            });

            mapInstance.on("mouseenter", "municipio-clusters", () => {
              mapInstance.getCanvas().style.cursor = "pointer";
            });
            mapInstance.on("mouseleave", "municipio-clusters", () => {
              mapInstance.getCanvas().style.cursor = "";
            });
            mapInstance.on("mouseenter", "municipio-points", () => {
              mapInstance.getCanvas().style.cursor = "pointer";
            });
            mapInstance.on("mouseleave", "municipio-points", () => {
              mapInstance.getCanvas().style.cursor = "";
            });
          }

          mapLoaded = true;
          window.clearTimeout(mapLoadTimeout);
          setMapStatus("ready");
        } catch (error) {
          console.error("[MunicipioDetail] Error configuring map:", error);
          setMapStatus("error");
        }
      });

      mapInstance.on("error", (event) => {
        const message = event?.error?.message || "";
        console.error("[MunicipioDetail] Mapbox error:", message || event);
        // Tile/source 404s are recoverable; only fail the overlay for auth/style issues.
        const isFatal =
          /access token/i.test(message) ||
          /unauthorized/i.test(message) ||
          /style/i.test(message);
        if (!mapLoaded && isFatal) {
          window.clearTimeout(mapLoadTimeout);
          setMapStatus("error");
        }
      });

      mapLoadTimeout = window.setTimeout(() => {
        if (!mapLoaded) {
          setMapStatus("error");
        }
      }, 10000);
    } catch (error) {
      console.error("[MunicipioDetail] Error initializing map:", error);
      setMapStatus("error");
    }

    return () => {
      window.clearTimeout(mapLoadTimeout);
      if (mapInstance) {
        mapInstance.remove();
      }
      if (map.current === mapInstance) {
        map.current = null;
      }
    };
  }, [mapNode, municipioData, boundaries]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-primary-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Cargando datos del municipio...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !municipioData) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-primary-50 px-4">
          <div className="text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Municipio no encontrado</h2>
            <p className="text-gray-600 mb-6">{error || "No se encontraron datos para este municipio"}</p>
            <div className="flex gap-4 justify-center">
              <Link
                to="/municipios"
                className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Volver a Municipios
              </Link>
              <Link
                to="/"
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Ir al Inicio
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
            <div className="flex items-center gap-4 mb-4">
              <Link
                to="/municipios"
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Volver a Municipios"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{municipioData.name}</h1>
                <p className="text-primary-100">
                  Datos detallados de energía solar
                  {extraData?.censusYear ? ` · Censo ${extraData.censusYear}` : ""}
                </p>
                {extraData?.tags?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {extraData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-primary-100 bg-white/80 p-5 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary-600">
                Perfil municipal
              </p>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-600">
                Explora la distribución de clientes solares y usa estos indicadores como punto de partida para entender el mercado local.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-sm font-semibold text-gray-700">
              <Users className="h-4 w-4 text-primary-600" />
              {stats.customers.toLocaleString()} registros
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Clientes Solares</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.customers.toLocaleString()}</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Ingreso Promedio</h3>
              <p className="text-3xl font-bold text-gray-900">${stats.avgIncome.toLocaleString()}</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Tasa de Penetración</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.penetrationRate}%</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Población Promedio</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.avgPopulation.toLocaleString()}</p>
            </div>
          </div>

          {/* Profile from MongoDB: description, highlights, fun fact, sources */}
          {extraData && (extraData.description || extraData.tags || extraData.highlights || extraData.funFact || extraData.pointsOfInterest || extraData.solarOpportunity || extraData.sources || extraData.censusYear) && (
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-gray-100 mb-8 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-50/50 to-transparent rounded-full blur-3xl -mr-32 -mt-32"></div>

              {extraData.description && (
                <div className="mb-8 relative z-10">
                  <div className="flex flex-col gap-3 mb-6 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-md">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-3xl font-bold text-gray-900">Sobre {municipioData.name}</h2>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold text-gray-500">
                      {extraData.censusYear && (
                        <span className="rounded-full bg-primary-50 px-3 py-1 text-primary-700">
                          Censo {extraData.censusYear}
                        </span>
                      )}
                      {formatUpdatedAt(extraData.updatedAt) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-3 py-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Actualizado {formatUpdatedAt(extraData.updatedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4 text-left">
                    {descriptionParagraphs(extraData.description).map((paragraph, index) => (
                      <p key={index} className="text-gray-700 leading-relaxed text-base md:text-lg">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {(extraData.description && (extraData.highlights || extraData.funFact || extraData.pointsOfInterest || extraData.solarOpportunity)) && (
                <div className="border-t border-gray-200 my-8"></div>
              )}

              {extraData.highlights && extraData.highlights.length > 0 && (
                <div className="relative z-10 mb-8 text-left">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Sparkles className="w-5 h-5 text-yellow-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Puntos Destacados</h3>
                  </div>
                  <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {extraData.highlights.map((highlight, index) => (
                      <li key={index} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
                        <div className="mt-0.5 p-1 bg-green-100 rounded-full">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-gray-700 leading-relaxed flex-1">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {extraData.funFact && (
                <div className="relative z-10 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 md:p-8 border-2 border-blue-200/50 shadow-lg">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/30 to-transparent rounded-full blur-2xl -mr-16 -mt-16"></div>
                  <div className="relative flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg flex-shrink-0">
                      <Lightbulb className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-bold text-gray-900 text-lg mb-2 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-500" />
                        Dato Curioso
                      </h4>
                      <p className="text-gray-800 leading-relaxed text-base md:text-lg font-medium">
                        {extraData.funFact}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {extraData.pointsOfInterest?.length > 0 && (
                <div className="relative z-10 mb-8 mt-8 text-left">
                  <div className="mb-4 flex items-center gap-2.5">
                    <div className="rounded-lg bg-rose-100 p-2">
                      <MapPin className="h-5 w-5 text-rose-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Puntos de interés</h3>
                  </div>
                  <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {extraData.pointsOfInterest.map((place, index) => {
                      const poi = normalizePoi(place);
                      if (!poi) return null;
                      return (
                        <li
                          key={`${poi.name}-${index}`}
                          className="flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50/70 p-4"
                        >
                          <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-500" />
                          <span className="flex-1 leading-relaxed text-gray-700">
                            <span className="font-medium">{poi.name}</span>
                            {poi.why ? (
                              <span className="mt-1 block text-sm text-gray-500">{poi.why}</span>
                            ) : null}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {extraData.solarOpportunity && (
                <div className="relative z-10 mt-8 overflow-hidden rounded-2xl border-2 border-amber-200/70 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-6 shadow-lg md:p-8">
                  <div className="relative flex items-start gap-4 text-left">
                    <div className="flex-shrink-0 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-3 shadow-lg">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="mb-2 text-lg font-bold text-gray-900">
                        Oportunidad solar
                      </h4>
                      <p className="text-base font-medium leading-relaxed text-gray-800 md:text-lg">
                        {extraData.solarOpportunity}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {(extraData.sources?.length > 0 || extraData.censusYear) && (
                <>
                  <div className="border-t border-gray-200 my-8"></div>
                  <div className="relative z-10 text-left">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <BookOpen className="w-5 h-5 text-gray-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Fuentes</h3>
                    </div>
                    {extraData.censusYear && (
                      <p className="text-sm text-gray-600 mb-3">
                        <span className="font-semibold">Año del Censo:</span> {extraData.censusYear}
                      </p>
                    )}
                    {extraData.sources?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {extraData.sources.map((source, index) => (
                          <span
                            key={index}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium border border-gray-200"
                          >
                            {source}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Additional Stats */}
          {(stats.avgPoverty > 0 || stats.avgUnemployment > 0 || stats.avgProfessional > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {stats.avgPoverty > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-center gap-3 mb-2">
                    <Home className="w-5 h-5 text-red-500" />
                    <h3 className="text-sm font-medium text-gray-600">Tasa de Pobreza</h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.avgPoverty}%</p>
                </div>
              )}
              {stats.avgUnemployment > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-center gap-3 mb-2">
                    <Building2 className="w-5 h-5 text-yellow-500" />
                    <h3 className="text-sm font-medium text-gray-600">Tasa de Desempleo</h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.avgUnemployment}%</p>
                </div>
              )}
              {stats.avgProfessional > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="w-5 h-5 text-blue-500" />
                    <h3 className="text-sm font-medium text-gray-600">Profesionales</h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.avgProfessional}%</p>
                </div>
              )}
            </div>
          )}

          {/* Map */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 mb-8">
            <div className="flex flex-col gap-3 bg-gradient-to-r from-primary-500 to-primary-600 p-4 text-white md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <h2 className="text-xl font-bold">Mapa del Municipio</h2>
                </div>
                <p className="mt-1 pl-7 text-sm text-primary-100">
                  Acerca el mapa para explorar la concentración de clientes.
                </p>
              </div>
              <div className="flex items-center gap-3 pl-7 text-xs font-medium md:pl-0">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />
                  Cliente
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-300" />
                  Clúster
                </span>
              </div>
            </div>
            <div className="relative h-[420px] w-full bg-gray-100 md:h-[560px]">
              <div
                ref={setMapNode}
                aria-label={`Mapa de clientes solares en ${municipioData.name}`}
                className="absolute left-0 top-0 h-full w-full"
              />
              {mapStatus !== "ready" && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gray-50/85 p-6 text-center backdrop-blur-[1px]">
                  <div className="max-w-sm rounded-2xl border border-gray-200 bg-white/95 px-6 py-5 shadow-lg">
                    {mapStatus === "error" ? (
                      <>
                        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-500" />
                        <p className="font-semibold text-gray-900">No se pudo cargar el mapa</p>
                        <p className="mt-1 text-sm text-gray-600">
                          Los indicadores del municipio siguen disponibles.
                        </p>
                      </>
                    ) : (
                      <>
                        <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary-600" />
                        <p className="font-semibold text-gray-900">Cargando mapa...</p>
                        <p className="mt-1 text-sm text-gray-600">
                          Preparando los puntos de energía solar.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/municipios"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Ver Todos los Municipios
            </Link>
            <Link
              to="/analytics"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <BarChart3 className="w-5 h-5" />
              Ver Analytics
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MunicipioDetail;
