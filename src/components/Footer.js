import React from "react";
import { Link } from "react-router-dom";
import { Github, Code, User } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white border-t border-gray-700">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About Section */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-primary-400">Power Solar Map</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Visualización interactiva de clientes de energía solar en Puerto Rico.
              Explore los datos de manera intuitiva y descubra información valiosa sobre
              la distribución de energía solar en la isla.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-primary-400">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-gray-300 hover:text-primary-400 transition-colors text-sm"
                >
                  Inicio
                </Link>
              </li>
              <li>
                <Link
                  to="/mapa"
                  className="text-gray-300 hover:text-primary-400 transition-colors text-sm"
                >
                  Mapa Interactivo
                </Link>
              </li>
              <li>
                <Link
                  to="/municipios"
                  className="text-gray-300 hover:text-primary-400 transition-colors text-sm"
                >
                  Municipios
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact/Info */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-primary-400">Información</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>
                <span className="font-semibold">Ubicación:</span> Puerto Rico
              </p>
              <p>
                <span className="font-semibold">Datos:</span> Clientes de Energía Solar
              </p>
              <p className="pt-2">
                Visualización de datos geográficos con Mapbox GL JS
              </p>
            </div>
          </div>
        </div>

        {/* Open Source Section */}
        <div className="border-t border-gray-700 pt-6 mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Code className="w-5 h-5 text-primary-400" />
              <div>
                <p className="text-white font-semibold text-sm">Proyecto Open Source</p>
                <p className="text-gray-400 text-xs">
                  Desarrollado con ❤️ por <span className="text-primary-400 font-medium">Javier Jaramillo</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 hover:text-white transition-all border border-gray-700 hover:border-primary-400"
                aria-label="View on GitHub"
              >
                <Github className="w-4 h-4" />
                Ver en GitHub
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 pt-6 flex flex-col md:flex-row justify-between items-center">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
            <p className="text-gray-400 text-sm">
              © {currentYear} Power Solar Map. Open Source.
            </p>
            <div className="flex items-center gap-2 text-gray-400 text-xs">
              <User className="w-3 h-3" />
              <span>Desarrollado por <span className="text-primary-400 font-medium">Javier Jaramillo</span></span>
            </div>
          </div>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link
              to="/privacidad"
              className="text-gray-400 hover:text-primary-400 transition-colors text-sm"
              aria-label="Privacy Policy"
            >
              Privacidad
            </Link>
            <Link
              to="/terminos"
              className="text-gray-400 hover:text-primary-400 transition-colors text-sm"
              aria-label="Terms of Service"
            >
              Términos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

