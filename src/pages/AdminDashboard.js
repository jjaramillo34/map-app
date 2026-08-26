import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import {
  LogOut,
  Save,
  Sparkles,
  FileText,
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle,
  Search,
  MapPin,
  Zap,
  ClipboardList,
  ListTodo,
  Route,
} from "lucide-react";
import {
  getAllMunicipalityData,
  getMunicipalityData,
  saveMunicipalityData,
  deleteMunicipalityData,
} from "../services/municipalityData";
import { logoutAdmin } from "../services/adminAuth";
import {
  generateMunicipalityProfile,
  GEMINI_MODELS,
  getGeminiModelLabel,
  getSavedGeminiModel,
  saveGeminiModel,
} from "../services/geminiService";
import geoJson from "../data/geojson.geojson";
import { ALL_MUNICIPALITIES } from "../data/municipioNames";
import AdminCoverageQueue from "../components/admin/AdminCoverageQueue";
import AdminVisitLists from "../components/admin/AdminVisitLists";
import { locatePoiList } from "../utils/territoryTools";
import {
  aggregateMunicipalityStats,
  computeGapScores,
} from "../utils/analyticsInsights";
import {
  findProfile,
  hasPublicProfile,
  isStaleProfile,
  namesMatch,
  normalizePoiList,
} from "../utils/municipalityProfile";

const resolveGeoJson = async (data) => {
  if (typeof data === "string" && (data.startsWith("/") || data.startsWith("http"))) {
    const response = await fetch(data);
    return response.json();
  }
  if (typeof data === "string") {
    return JSON.parse(data);
  }
  return data;
};

const computeMunicipalityStats = (features = [], municipioName) => {
  const selected = features.filter((feature) => {
    const props = feature.properties || {};
    const county = props.County
      ? props.County.replace(" Municipio", "").trim()
      : "";
    return (
      namesMatch(county, municipioName) ||
      namesMatch(props.City, municipioName) ||
      namesMatch(props.Municipio, municipioName)
    );
  });

  if (selected.length === 0) return {};

  let totalIncome = 0;
  let incomeCount = 0;
  let totalPopulation = 0;
  let populationCount = 0;

  selected.forEach((feature) => {
    const props = feature.properties || {};
    const income = props.Income || props.IncomePerCap || 0;
    const population = props.TotalPop || props.Population || 0;
    if (income > 0) {
      totalIncome += income;
      incomeCount++;
    }
    if (population > 0) {
      totalPopulation += population;
      populationCount++;
    }
  });

  const avgIncome = incomeCount > 0 ? Math.round(totalIncome / incomeCount) : 0;
  const avgPopulation =
    populationCount > 0 ? Math.round(totalPopulation / populationCount) : 0;
  const penetrationRate =
    avgPopulation > 0
      ? parseFloat(((selected.length / avgPopulation) * 100).toFixed(2))
      : 0;

  return {
    customers: selected.length,
    avgIncome,
    avgPopulation,
    penetrationRate,
  };
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [selectedMunicipio, setSelectedMunicipio] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [highlights, setHighlights] = useState("");
  const [funFact, setFunFact] = useState("");
  const [pointsOfInterest, setPointsOfInterest] = useState([]);
  const [solarOpportunity, setSolarOpportunity] = useState("");
  const [salesNotes, setSalesNotes] = useState("");
  const [profiles, setProfiles] = useState({});
  const [adminTab, setAdminTab] = useState("queue");
  const [sources, setSources] = useState("");
  const [censusYear, setCensusYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [geoFeatures, setGeoFeatures] = useState([]);
  const [geminiModel, setGeminiModel] = useState(getSavedGeminiModel);
  const [locatingPoi, setLocatingPoi] = useState(null);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    loadMunicipalities();
    resolveGeoJson(geoJson)
      .then((data) => setGeoFeatures(data?.features || []))
      .catch((error) => {
        console.error("Error loading customer geojson:", error);
      });
  }, []);

  useEffect(() => {
    if (selectedMunicipio) {
      loadMunicipioData(selectedMunicipio);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      clearForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMunicipio]);

  const loadMunicipalities = async () => {
    try {
      const data = await getAllMunicipalityData();
      setProfiles(data || {});
    } catch (error) {
      console.error("Error loading municipalities:", error);
      setProfiles({});
    }
  };

  const loadMunicipioData = async (municipioName) => {
    try {
      const data = await getMunicipalityData(municipioName);
      if (data) {
        setDescription(data.description || "");
        setTags(data.tags ? data.tags.join(", ") : "");
        setHighlights(data.highlights ? data.highlights.join("\n") : "");
        setFunFact(data.funFact || "");
        setPointsOfInterest(normalizePoiList(data.pointsOfInterest));
        setSolarOpportunity(data.solarOpportunity || "");
        setSalesNotes(data.salesNotes || "");
        setSources(data.sources ? data.sources.join(", ") : "");
        setCensusYear(data.censusYear || "");
      } else {
        clearForm();
      }
    } catch (error) {
      console.error('Error loading municipality data:', error);
      clearForm();
    }
  };

  const clearForm = () => {
    setDescription("");
    setTags("");
    setHighlights("");
    setFunFact("");
    setPointsOfInterest([]);
    setSolarOpportunity("");
    setSalesNotes("");
    setSources("");
    setCensusYear("");
  };

  const handleLogout = async () => {
    await logoutAdmin();
    navigate("/admin");
  };

  const handleGenerate = async () => {
    if (!selectedMunicipio) {
      setMessage({ type: "error", text: "Por favor seleccione un municipio" });
      return;
    }

    setGenerating(true);
    setMessage({ type: "", text: "" });

    try {
      let features = geoFeatures;
      if (!features.length) {
        const data = await resolveGeoJson(geoJson);
        features = data?.features || [];
        setGeoFeatures(features);
      }

      const stats = computeMunicipalityStats(features, selectedMunicipio);
      const profile = await generateMunicipalityProfile(
        selectedMunicipio,
        stats,
        geminiModel
      );

      setDescription(profile.description || "");
      setTags(profile.tags?.length ? profile.tags.join(", ") : "");
      setHighlights(
        profile.highlights?.length ? profile.highlights.join("\n") : ""
      );
      setFunFact(profile.funFact || "");
      setPointsOfInterest(
        await locatePois(normalizePoiList(profile.pointsOfInterest), selectedMunicipio)
      );
      setSolarOpportunity(profile.solarOpportunity || "");
      setSources(profile.sources?.length ? profile.sources.join(", ") : "");
      setCensusYear(profile.censusYear || "");

      setMessage({
        type: "success",
        text: `Contenido generado con ${getGeminiModelLabel(
          profile.model || geminiModel
        )} usando datos reales del mapa`,
      });
    } catch (error) {
      console.error("Error generating content:", error);
      setMessage({
        type: "error",
        text:
          error.message ||
          "Error al generar contenido. Verifique GEMINI_API_KEY.",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!selectedMunicipio) {
      setMessage({ type: "error", text: "Por favor seleccione un municipio" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const data = {
        description: description.trim(),
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0),
        highlights: highlights
          .split("\n")
          .map((h) => h.trim())
          .filter((h) => h.length > 0),
        funFact: funFact.trim(),
        pointsOfInterest: normalizePoiList(pointsOfInterest),
        solarOpportunity: solarOpportunity.trim(),
        salesNotes: salesNotes.trim(),
        sources: sources
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0),
        censusYear: censusYear.trim(),
      };

      const success = await saveMunicipalityData(selectedMunicipio, data);
      if (success) {
        setMessage({ type: "success", text: "Datos guardados exitosamente en MongoDB" });
        await loadMunicipalities();
        scrollToTop();
      } else {
        setMessage({ type: "error", text: "Error al guardar los datos" });
      }
    } catch (error) {
      console.error("Error saving:", error);
      setMessage({ type: "error", text: "Error al guardar los datos" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMunicipio) {
      return;
    }

    if (
      !window.confirm(
        `¿Está seguro de eliminar los datos de ${selectedMunicipio}?`
      )
    ) {
      return;
    }

    try {
      const success = await deleteMunicipalityData(selectedMunicipio);
      if (success) {
        setMessage({ type: "success", text: "Datos eliminados exitosamente de MongoDB" });
        setSelectedMunicipio("");
        clearForm();
        await loadMunicipalities();
      } else {
        setMessage({ type: "error", text: "Error al eliminar los datos" });
      }
    } catch (error) {
      console.error("Error deleting:", error);
      setMessage({ type: "error", text: "Error al eliminar los datos" });
    }
  };

  const filteredMunicipalities = ALL_MUNICIPALITIES.filter((m) =>
    m.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const coverage = useMemo(() => {
    const aggregated = aggregateMunicipalityStats(geoFeatures);
    const merged = ALL_MUNICIPALITIES.map((name) => {
      const match = aggregated.find((item) => namesMatch(item.name, name));
      return (
        match || {
          name,
          customers: 0,
          avgIncome: 0,
          avgPopulation: 0,
          penetrationRate: 0,
        }
      );
    });
    const scored = computeGapScores(merged).map((row) => ({
      ...row,
      profile: findProfile(row.name, profiles),
    }));
    const missing = scored
      .filter((row) => !hasPublicProfile(row.profile))
      .sort((a, b) => (b.gapScore || 0) - (a.gapScore || 0));
    const stale = scored
      .filter((row) => isStaleProfile(row.profile))
      .sort(
        (a, b) =>
          Date.parse(a.profile?.updatedAt || 0) -
          Date.parse(b.profile?.updatedAt || 0)
      );
    return { missing, stale, topEmpty: missing.slice(0, 10) };
  }, [geoFeatures, profiles]);

  const openMunicipio = (name) => {
    setSelectedMunicipio(name);
    setAdminTab("edit");
    scrollToTop();
  };

  const updatePoi = (index, field, value) => {
    setPointsOfInterest((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  };

  const locatePois = async (list, municipioName) =>
    locatePoiList(list, municipioName, process.env.REACT_APP_MAPBOX_TOKEN);

  const locateOnePoi = async (index) => {
    if (!selectedMunicipio) return;
    const poi = pointsOfInterest[index];
    if (!poi?.name) return;
    setLocatingPoi(index);
    try {
      const [located] = await locatePois([poi], selectedMunicipio);
      setPointsOfInterest((current) =>
        current.map((item, itemIndex) => (itemIndex === index ? located : item))
      );
    } finally {
      setLocatingPoi(null);
    }
  };

  return (
    <Layout showFooter={false}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Panel de Administración</h1>
                <p className="text-primary-100">
                  Gestión de datos de municipios
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Cerrar Sesión
              </button>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                { id: "queue", label: "Cola de contenido", icon: ListTodo },
                { id: "edit", label: "Editor", icon: ClipboardList },
                { id: "routes", label: "Rutas", icon: Route },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setAdminTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${
                    adminTab === tab.id
                      ? "bg-white text-primary-800"
                      : "bg-white/15 text-white hover:bg-white/25"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          {/* Message */}
          {message.text && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                message.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <p>{message.text}</p>
            </div>
          )}

          {adminTab === "queue" && (
            <AdminCoverageQueue
              missing={coverage.missing}
              stale={coverage.stale}
              topEmpty={coverage.topEmpty}
              geminiModel={geminiModel}
              getStats={(name) => computeMunicipalityStats(geoFeatures, name)}
              onOpen={openMunicipio}
              onSaved={loadMunicipalities}
              onModelChange={(model) => {
                setGeminiModel(model);
                saveGeminiModel(model);
              }}
            />
          )}

          {adminTab === "routes" && <AdminVisitLists />}

          {adminTab === "edit" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Sidebar - Municipality List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Municipios
                  </h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar municipio..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div className="max-h-[32rem] overflow-y-auto space-y-2">
                  {filteredMunicipalities.map((municipio) => {
                    const hasData = hasPublicProfile(findProfile(municipio, profiles));
                    return (
                      <button
                        key={municipio}
                        onClick={() => openMunicipio(municipio)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                          selectedMunicipio === municipio
                            ? "bg-primary-600 text-white shadow-md"
                            : hasData
                            ? "bg-gray-100 hover:bg-gray-200 text-gray-900"
                            : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{municipio}</span>
                          {hasData && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedMunicipio
                      ? `Editar: ${selectedMunicipio}`
                      : "Seleccione un municipio"}
                  </h2>
                  {selectedMunicipio && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-2 text-sm font-semibold text-white transition-all hover:from-primary-700 hover:to-primary-800 disabled:opacity-50"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {loading ? "Guardando..." : "Guardar"}
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>

                {selectedMunicipio ? (
                  <div className="space-y-6">
                    {/* Description */}
                    <div>
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Descripción
                        </label>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <label className="sr-only" htmlFor="gemini-model">
                            Modelo de Gemini
                          </label>
                          <select
                            id="gemini-model"
                            value={geminiModel}
                            onChange={(event) => {
                              setGeminiModel(event.target.value);
                              saveGeminiModel(event.target.value);
                            }}
                            disabled={generating}
                            className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-800 outline-none focus:border-transparent focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                          >
                            {GEMINI_MODELS.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.label}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 px-3 py-1.5 text-sm text-white transition-all hover:from-purple-700 hover:to-purple-800 disabled:opacity-50"
                          >
                            {generating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                            {generating ? "Generando..." : "Generar con Gemini"}
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                        placeholder="Descripción del municipio..."
                      />
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags (separados por comas)
                      </label>
                      <input
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        placeholder="Turismo, Energía Solar, Cultura..."
                      />
                    </div>

                    {/* Highlights */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Puntos Destacados (uno por línea)
                      </label>
                      <textarea
                        value={highlights}
                        onChange={(e) => setHighlights(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                        placeholder="Punto destacado 1&#10;Punto destacado 2..."
                      />
                    </div>

                    {/* Fun Fact */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dato Curioso
                      </label>
                      <input
                        type="text"
                        value={funFact}
                        onChange={(e) => setFunFact(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        placeholder="Un dato interesante sobre el municipio..."
                      />
                    </div>

                    <div>
                      <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                        <MapPin className="h-4 w-4 text-primary-600" />
                        Puntos de interés
                      </label>
                      <div className="space-y-3">
                        {pointsOfInterest.map((poi, index) => (
                          <div key={`${poi.name}-${index}`} className="rounded-lg border border-gray-200 p-3">
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                              <input
                                type="text"
                                value={poi.name}
                                onChange={(event) => updatePoi(index, "name", event.target.value)}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Nombre del lugar"
                              />
                              <input
                                type="text"
                                value={poi.why}
                                onChange={(event) => updatePoi(index, "why", event.target.value)}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Por qué importa"
                              />
                            </div>
                            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                              <span>
                                {poi.lat && poi.lng
                                  ? `${poi.lat.toFixed(4)}, ${poi.lng.toFixed(4)}`
                                  : "Sin coordenadas"}
                              </span>
                              <div className="flex gap-3">
                                <button
                                  type="button"
                                  onClick={() => locateOnePoi(index)}
                                  disabled={!poi.name || locatingPoi === index}
                                  className="font-semibold text-primary-700 disabled:opacity-50"
                                >
                                  {locatingPoi === index ? "Ubicando…" : "Ubicar"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPointsOfInterest((current) =>
                                      current.filter((_, itemIndex) => itemIndex !== index)
                                    )
                                  }
                                  className="font-semibold text-red-600"
                                >
                                  Quitar
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setPointsOfInterest((current) => [
                              ...current,
                              { name: "", why: "", lat: null, lng: null },
                            ])
                          }
                          className="rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-600"
                        >
                          Añadir punto de interés
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Zap className="h-4 w-4 text-amber-500" />
                        Oportunidad solar
                      </label>
                      <textarea
                        value={solarOpportunity}
                        onChange={(e) => setSolarOpportunity(e.target.value)}
                        rows={3}
                        className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-primary-500"
                        placeholder="Por qué este municipio es una oportunidad de mercado solar..."
                      />
                    </div>

                    {/* Sources */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fuentes (separadas por comas)
                      </label>
                      <input
                        type="text"
                        value={sources}
                        onChange={(e) => setSources(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        placeholder="US Census Bureau 2020, Wikipedia - [Municipio]..."
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Ejemplo: US Census Bureau 2020, Wikipedia - {selectedMunicipio}
                      </p>
                    </div>

                    {/* Census Year */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Año del Censo
                      </label>
                      <input
                        type="text"
                        value={censusYear}
                        onChange={(e) => setCensusYear(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        placeholder="2020"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Año específico del Censo de Estados Unidos utilizado (ej: 2020, 2010)
                      </p>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Notas de ventas (privado)
                      </label>
                      <textarea
                        value={salesNotes}
                        onChange={(e) => setSalesNotes(e.target.value)}
                        rows={4}
                        className="w-full resize-none rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3 outline-none focus:ring-2 focus:ring-amber-400"
                        placeholder="A quién visitar, mejores días, estacionamiento, portones, ya visitado…"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Solo lo ve el equipo admin. No aparece en la ficha pública.
                      </p>
                    </div>

                    {/* Save Button */}
                    <div className="flex gap-4">
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Save className="w-5 h-5" />
                        )}
                        {loading ? "Guardando..." : "Guardar Cambios"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>Seleccione un municipio de la lista para comenzar</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          )}

        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;

