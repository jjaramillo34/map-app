import React from "react";
import { Link } from "react-router-dom";
import { Map, Building2, Layers3, Flame, Globe, BarChart3, Search, Brain, ArrowRight, CheckCircle2, Trophy } from "lucide-react";
import Layout from "../components/Layout";
import MunicipalityAnalytics from "../components/MunicipalityAnalytics";

const LandingPage = () => {
  return (
    <Layout>
      <div className="relative min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary-100/60 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-flag-red/10 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-[1.05fr_.95fr]">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/80 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-700 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-flag-red" />
                Datos abiertos de Puerto Rico
              </div>
              {/* Main Heading */}
              <h1 className="mb-6 max-w-2xl text-4xl font-bold tracking-tight text-gray-900 md:text-6xl">
                Entiende dónde crece la energía solar.
              </h1>
              <p className="mb-4 max-w-xl text-xl text-gray-600 md:text-2xl">
                Visualización interactiva de clientes solares en Puerto Rico.
              </p>
              <p className="mb-10 max-w-xl text-base leading-relaxed text-gray-500 md:text-lg">
                Explora concentraciones por municipio, descubre patrones geográficos y convierte datos complejos en decisiones más claras.
              </p>

              {/* CTA Buttons */}
              <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row">
                <Link
                  to="/mapa"
                  className="px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center gap-2"
                >
                  <Map className="w-5 h-5" />
                  Ver el mapa
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  to="/municipios"
                  className="px-8 py-4 bg-white text-primary-600 border-2 border-primary-600 rounded-xl font-semibold text-lg shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200 flex items-center gap-2"
                >
                  <Building2 className="w-5 h-5" />
                  Explorar municipios
                </Link>
              </div>

              {/* Map Type Quick Links */}
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  to="/cluster"
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium text-sm shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                >
                  <Layers3 className="w-4 h-4" />
                  Clusters
                </Link>
                <Link
                  to="/heatmap"
                  className="px-4 py-2 bg-orange-50 text-orange-600 rounded-lg font-medium text-sm shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                >
                  <Flame className="w-4 h-4" />
                  Calor
                </Link>
                <Link
                  to="/oportunidad"
                  className="px-4 py-2 bg-orange-50 text-orange-700 rounded-lg font-medium text-sm shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                >
                  <Trophy className="w-4 h-4" />
                  Oportunidad
                </Link>
                <Link
                  to="/3d"
                  className="px-4 py-2 bg-flag-red/10 text-flag-red rounded-lg font-medium text-sm shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                >
                  <Globe className="w-4 h-4" />
                  3D
                </Link>
                <Link
                  to="/analytics"
                  className="px-4 py-2 bg-primary-50 text-primary-700 rounded-lg font-medium text-sm shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                >
                  <Brain className="w-4 h-4" />
                  Analytics ML
                </Link>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-md lg:ml-auto">
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-primary-200/50 to-blue-100/40 blur-2xl" />
              <div className="relative rounded-3xl border border-white bg-white/90 p-5 shadow-2xl backdrop-blur-md">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-primary-600">Vista general</p>
                    <h2 className="mt-1 text-lg font-bold text-gray-900">Actividad solar por zona</h2>
                  </div>
                  <Map className="h-6 w-6 text-primary-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-primary-50 p-4">
                    <p className="text-xs font-medium text-gray-500">Municipios</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">78</p>
                    <p className="mt-1 text-xs text-primary-700">en todo Puerto Rico</p>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 p-4">
                    <p className="text-xs font-medium text-gray-500">Clientes</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">13K+</p>
                    <p className="mt-1 text-xs text-emerald-700">en el conjunto de datos</p>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl bg-gray-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-600">Distribución visual</span>
                    <span className="text-xs text-gray-400">baja → alta</span>
                  </div>
                  <div className="flex h-3 gap-1 overflow-hidden rounded-full">
                    {["bg-blue-100", "bg-cyan-300", "bg-emerald-400", "bg-lime-400", "bg-orange-400", "bg-orange-600"].map((color) => <span key={color} className={`flex-1 ${color}`} />)}
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
                    {["Mapa interactivo", "Filtros por municipio", "Analytics avanzado"].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-gray-600">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Características Principales
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Herramientas poderosas para explorar y analizar datos de energía solar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-200 border border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mb-4">
                <Map className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Mapa Interactivo
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Explore visualizaciones interactivas con heatmaps, clusters y marcadores
                personalizados para entender la distribución de energía solar.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-200 border border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Filtrado por Municipios
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Filtre y explore datos específicos por municipio para obtener insights
                detallados sobre la distribución geográfica de clientes solares.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-200 border border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Búsqueda Avanzada
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Utilice la búsqueda geográfica integrada para encontrar ubicaciones
                específicas y navegar rápidamente por el mapa.
              </p>
            </div>

            {/* Feature 4 - Analytics */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-200 border border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Analytics con ML
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Análisis avanzado con Machine Learning: clustering, predicciones, correlaciones
                y detección de anomalías para insights estratégicos.
              </p>
              <Link
                to="/analytics"
                className="mt-4 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold text-sm"
              >
                Ver Analytics
                <BarChart3 className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">78</div>
                <div className="text-primary-100 text-lg">Municipios</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">13K+</div>
                <div className="text-primary-100 text-lg">Clientes Solares</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">100%</div>
                <div className="text-primary-100 text-lg">Puerto Rico</div>
              </div>
            </div>
          </div>
        </div>

        {/* Municipality Analytics Section */}
        <MunicipalityAnalytics />
      </div>
    </Layout>
  );
};

export default LandingPage;
