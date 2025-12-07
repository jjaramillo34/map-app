import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import {
  getAllMunicipalityData,
  getMunicipalityData,
  saveMunicipalityData,
  deleteMunicipalityData,
} from "../services/municipalityData";
import {
  generateMunicipalityDescription,
  generateAdditionalContent,
} from "../services/openaiService";

// List of all Puerto Rico municipalities
const ALL_MUNICIPALITIES = [
  "Aguada", "Aguadilla", "Aguas Buenas", "Aibonito", "Añasco", "Arecibo",
  "Arroyo", "Barceloneta", "Barranquitas", "Bayamón", "Cabo Rojo", "Caguas",
  "Camuy", "Canóvanas", "Carolina", "Cataño", "Cayey", "Ceiba", "Ciales",
  "Cidra", "Coamo", "Comerío", "Corozal", "Culebra", "Dorado", "Fajardo",
  "Florida", "Guánica", "Guayama", "Guayanilla", "Guaynabo", "Gurabo",
  "Hatillo", "Hormigueros", "Humacao", "Isabela", "Jayuya", "Juana Díaz",
  "Juncos", "Lajas", "Lares", "Las Marías", "Las Piedras", "Loíza",
  "Luquillo", "Manatí", "Maricao", "Maunabo", "Mayagüez", "Moca",
  "Morovis", "Naguabo", "Naranjito", "Orocovis", "Patillas", "Peñuelas",
  "Ponce", "Quebradillas", "Rincón", "Río Grande", "Sabana Grande",
  "Salinas", "San Germán", "San Juan", "San Lorenzo", "San Sebastián",
  "Santa Isabel", "Toa Alta", "Toa Baja", "Trujillo Alto", "Utuado",
  "Vega Alta", "Vega Baja", "Vieques", "Villalba", "Yabucoa", "Yauco",
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [municipalities, setMunicipalities] = useState([]);
  const [selectedMunicipio, setSelectedMunicipio] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [highlights, setHighlights] = useState("");
  const [funFact, setFunFact] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadMunicipalities();
  }, []);

  useEffect(() => {
    if (selectedMunicipio) {
      loadMunicipioData(selectedMunicipio);
    } else {
      clearForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMunicipio]);

  const loadMunicipalities = async () => {
    try {
      const data = await getAllMunicipalityData();
      setMunicipalities(Object.keys(data));
    } catch (error) {
      console.error('Error loading municipalities:', error);
      setMunicipalities([]);
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
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_authenticated");
    sessionStorage.removeItem("admin_login_time");
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
      // Mock stats - in real app, you'd fetch these from analytics
      const mockStats = {
        customers: Math.floor(Math.random() * 1000) + 100,
        avgIncome: Math.floor(Math.random() * 50000) + 20000,
        penetrationRate: (Math.random() * 5 + 1).toFixed(2),
        avgPopulation: Math.floor(Math.random() * 50000) + 10000,
      };

      // Generate description
      const generatedDescription = await generateMunicipalityDescription(
        selectedMunicipio,
        mockStats
      );
      setDescription(generatedDescription);

      // Generate additional content
      try {
        const additionalContent = await generateAdditionalContent(
          selectedMunicipio,
          mockStats
        );
        if (additionalContent.tags) {
          setTags(additionalContent.tags.join(", "));
        }
        if (additionalContent.highlights) {
          setHighlights(additionalContent.highlights.join("\n"));
        }
        if (additionalContent.funFact) {
          setFunFact(additionalContent.funFact);
        }
      } catch (err) {
        console.warn("Could not generate additional content:", err);
        // Continue even if additional content fails
      }

      setMessage({
        type: "success",
        text: "Contenido generado exitosamente con IA",
      });
    } catch (error) {
      console.error("Error generating content:", error);
      setMessage({
        type: "error",
        text: error.message || "Error al generar contenido. Verifique su API key de OpenAI.",
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
      };

      const success = await saveMunicipalityData(selectedMunicipio, data);
      if (success) {
        setMessage({ type: "success", text: "Datos guardados exitosamente en MongoDB" });
        await loadMunicipalities();
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

                <div className="max-h-96 overflow-y-auto space-y-2">
                  {filteredMunicipalities.map((municipio) => {
                    const hasData = municipalities.includes(municipio);
                    return (
                      <button
                        key={municipio}
                        onClick={() => setSelectedMunicipio(municipio)}
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
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedMunicipio
                      ? `Editar: ${selectedMunicipio}`
                      : "Seleccione un municipio"}
                  </h2>
                  {selectedMunicipio && (
                    <button
                      onClick={handleDelete}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </button>
                  )}
                </div>

                {selectedMunicipio ? (
                  <div className="space-y-6">
                    {/* Description */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Descripción
                        </label>
                        <button
                          onClick={handleGenerate}
                          disabled={generating}
                          className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                          {generating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                          {generating ? "Generando..." : "Generar con IA"}
                        </button>
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
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;

