import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Menu, MapPin, Layers3, Flame, Globe, BarChart3 } from "lucide-react";

const Header = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-gradient-to-br from-white/95 to-white/98 shadow-lg backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <Link to="/" className="group flex items-center space-x-3" onClick={() => setIsMenuOpen(false)}>
            <div className="hidden h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-sm font-bold text-white shadow-md sm:flex">
              PS
            </div>
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
          <nav className="hidden items-center space-x-1 md:flex" aria-label="Navegación principal">
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
              <button
                type="button"
                aria-haspopup="true"
                className={`flex items-center gap-1 rounded-lg px-4 py-2 font-medium transition-all duration-200 ${
                isActive("/mapa") || isActive("/cluster") || isActive("/heatmap") || isActive("/3d")
                  ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-100 hover:text-primary-600"
                }`}
              >
                Mapas
                <ChevronDown className="h-4 w-4" />
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
              type="button"
              className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              {isMenuOpen ? <ChevronDown className="h-6 w-6 rotate-180" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <nav id="mobile-navigation" className="border-t border-black/5 bg-white px-4 py-3 md:hidden" aria-label="Navegación móvil">
          {[
            ["/", "Inicio"],
            ["/mapa", "Mapa interactivo"],
            ["/municipios", "Municipios"],
            ["/analytics", "Analytics"],
          ].map(([path, label]) => (
            <Link
              key={path}
              to={path}
              onClick={() => setIsMenuOpen(false)}
              className={`block rounded-lg px-3 py-3 text-sm font-semibold ${
                isActive(path) ? "bg-primary-50 text-primary-700" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {label}
            </Link>
          ))}
          <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Capas de mapa</p>
          {[
            ["/cluster", "Clusters"],
            ["/heatmap", "Mapa de calor"],
            ["/3d", "Vista 3D"],
          ].map(([path, label]) => (
            <Link
              key={path}
              to={path}
              onClick={() => setIsMenuOpen(false)}
              className={`block rounded-lg px-3 py-3 text-sm ${
                isActive(path) ? "bg-primary-50 text-primary-700" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
};

export default Header;
