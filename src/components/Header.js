import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Menu, MapPin, Layers3, Flame, Globe, BarChart3 } from "lucide-react";

const Header = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-gradient-to-br from-white/95 to-white/98 backdrop-blur-md shadow-lg border-b border-black/5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="flex flex-col">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight group-hover:text-primary-600 transition-colors">
                Power Solar Map
              </h1>
              <p className="text-xs md:text-sm text-gray-600 font-normal">
                Clientes de Energía Solar en Puerto Rico
              </p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActive("/")
                  ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-100 hover:text-primary-600"
              }`}
            >
              Inicio
            </Link>
            <div className="relative group">
              <button className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-1 ${
                isActive("/mapa") || isActive("/cluster") || isActive("/heatmap") || isActive("/3d")
                  ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-100 hover:text-primary-600"
              }`}>
                Mapas
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <Link
                  to="/mapa"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-lg flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  Mapa Interactivo
                </Link>
                <Link
                  to="/cluster"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Layers3 className="w-4 h-4" />
                  Mapa de Clusters
                </Link>
                <Link
                  to="/heatmap"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Flame className="w-4 h-4" />
                  Mapa de Calor
                </Link>
                <Link
                  to="/3d"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 last:rounded-b-lg flex items-center gap-2"
                >
                  <Globe className="w-4 h-4" />
                  Vista 3D
                </Link>
              </div>
            </div>
            <Link
              to="/municipios"
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActive("/municipios")
                  ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-100 hover:text-primary-600"
              }`}
            >
              Municipios
            </Link>
            <Link
              to="/analytics"
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                isActive("/analytics")
                  ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-100 hover:text-primary-600"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

