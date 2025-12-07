import React from "react";
import { Link } from "react-router-dom";
import { Map, Building2, Layers3, Flame, Globe, MapPin, Zap, BarChart3, Search, Brain } from "lucide-react";
import Layout from "../components/Layout";
import MunicipalityAnalytics from "../components/MunicipalityAnalytics";

const LandingPage = () => {
  return (
    <Layout>
      <div className="relative min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
            <div className="text-center">
              {/* Main Heading */}
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
                Power Solar Map
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-4 max-w-3xl mx-auto">
                Visualización Interactiva de Clientes de Energía Solar
              </p>
              <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
                Explore los datos de energía solar en Puerto Rico de manera intuitiva.
                Descubra la distribución geográfica de clientes solares en toda la isla.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <Link
                  to="/mapa"
                  className="px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center gap-2"
                >
                  <Map className="w-5 h-5" />
                  Ver Mapa Interactivo
                </Link>
                <Link
                  to="/municipios"
                  className="px-8 py-4 bg-white text-primary-600 border-2 border-primary-600 rounded-xl font-semibold text-lg shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200 flex items-center gap-2"
                >
                  <Building2 className="w-5 h-5" />
                  Explorar Municipios
                </Link>
              </div>

              {/* Map Type Quick Links */}
              <div className="flex flex-wrap justify-center gap-3 mt-4">
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
                  to="/3d"
                  className="px-4 py-2 bg-purple-50 text-purple-600 rounded-lg font-medium text-sm shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                >
                  <Globe className="w-4 h-4" />
                  3D
                </Link>
                <Link
                  to="/analytics"
                  className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-medium text-sm shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                >
                  <Brain className="w-4 h-4" />
                  Analytics ML
                </Link>
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

