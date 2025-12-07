import React, { useRef, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import geoJson from "../data/geojson.geojson";
import Layout from "../components/Layout";
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
  Tag,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";
import { getMunicipalityData } from "../services/municipalityData";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

const MunicipioDetail = () => {
  const { municipioName } = useParams();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [municipioData, setMunicipioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [extraData, setExtraData] = useState(null);

  // Decode municipality name from URL
  const decodedName = municipioName ? decodeURIComponent(municipioName) : "";

  // Load geojson data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
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
        
        setData(dataToLoad);
        
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
    
    // Load extra data (descriptions, etc.) from MongoDB
    getMunicipalityData(municipioName)
      .then((extra) => {
        setExtraData(extra);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading municipality extra data:', error);
        setExtraData(null);
        setLoading(false);
      });
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !municipioData || map.current) return;

    // Initialize map centered on municipality
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v10",
      center: [municipioData.center.lng, municipioData.center.lat],
      zoom: 12,
      bearing: 0,
      pitch: 0,
    });

    // Add controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.current.addControl(new mapboxgl.FullscreenControl(), "top-right");

    // Add geolocation control
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

    // Add data when map loads
    map.current.on("load", () => {
      if (!municipioData || !municipioData.features) return;

      // Create filtered GeoJSON for this municipality
      const filteredGeoJson = {
        type: "FeatureCollection",
        features: municipioData.features,
      };

      // Add source
      map.current.addSource("municipio-data", {
        type: "geojson",
        data: filteredGeoJson,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      // Add cluster layer
      map.current.addLayer({
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

      // Add cluster count labels
      map.current.addLayer({
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

      // Add unclustered points
      map.current.addLayer({
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

      // Add popups
      map.current.on("click", "municipio-clusters", (e) => {
        const features = map.current.queryRenderedFeatures(e.point, {
          layers: ["municipio-clusters"],
        });
        const clusterId = features[0].properties.cluster_id;
        const source = map.current.getSource("municipio-data");
        
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          
          map.current.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom,
          });
        });
      });

      // Popup for unclustered points
      map.current.on("click", "municipio-points", (e) => {
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
          .addTo(map.current);
      });

      // Cursor changes
      map.current.on("mouseenter", "municipio-clusters", () => {
        map.current.getCanvas().style.cursor = "pointer";
      });
      map.current.on("mouseleave", "municipio-clusters", () => {
        map.current.getCanvas().style.cursor = "";
      });
      map.current.on("mouseenter", "municipio-points", () => {
        map.current.getCanvas().style.cursor = "pointer";
      });
      map.current.on("mouseleave", "municipio-points", () => {
        map.current.getCanvas().style.cursor = "";
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [municipioData]);

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
                <p className="text-primary-100">Datos detallados de energía solar</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
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

          {/* Description Section */}
          {extraData && (extraData.description || extraData.tags || extraData.highlights || extraData.funFact) && (
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-gray-100 mb-8 overflow-hidden relative">
              {/* Decorative gradient background */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-50/50 to-transparent rounded-full blur-3xl -mr-32 -mt-32"></div>
              
              {extraData.description && (
                <div className="mb-8 relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-md">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Sobre {municipioData.name}</h2>
                  </div>
                  <div className="text-left">
                    <p className="text-gray-700 leading-relaxed text-base md:text-lg mb-0 text-left">
                      {extraData.description.split('\n').map((paragraph, index) => (
                        <span key={index} className="block">
                          {paragraph}
                          {index < extraData.description.split('\n').length - 1 && <><br /><br /></>}
                        </span>
                      ))}
                    </p>
                  </div>
                </div>
              )}

              {/* Divider */}
              {(extraData.description && (extraData.tags || extraData.highlights || extraData.funFact)) && (
                <div className="border-t border-gray-200 my-8"></div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                {/* Tags Section */}
                {extraData.tags && extraData.tags.length > 0 && (
                  <div className="text-left">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Tag className="w-5 h-5 text-purple-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Tags</h3>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {extraData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Highlights Section */}
                {extraData.highlights && extraData.highlights.length > 0 && (
                  <div className="text-left">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Sparkles className="w-5 h-5 text-yellow-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Puntos Destacados</h3>
                    </div>
                    <ul className="space-y-3">
                      {extraData.highlights.map((highlight, index) => (
                        <li key={index} className="flex items-start gap-3 group">
                          <div className="mt-0.5 p-1 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="text-gray-700 leading-relaxed flex-1">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Fun Fact Section */}
              {extraData.funFact && (
                <>
                  {(extraData.tags || extraData.highlights) && (
                    <div className="border-t border-gray-200 my-8"></div>
                  )}
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
                        <p className="text-gray-800 leading-relaxed text-base md:text-lg font-medium text-left">
                          {extraData.funFact}
                        </p>
                      </div>
                    </div>
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
            <div className="p-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <h2 className="text-xl font-bold">Mapa del Municipio</h2>
              </div>
            </div>
            <div className="relative w-full" style={{ height: "600px" }}>
              <div ref={mapContainer} className="absolute top-0 left-0 w-full h-full" />
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

