import React from "react";
import Layout from "../components/Layout";
import { Shield, Lock, Eye, Database, Github, Code } from "lucide-react";
import { Link } from "react-router-dom";

const Privacidad = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Política de Privacidad
            </h1>
            <p className="text-lg text-gray-600">
              Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 md:p-12 space-y-8">
            {/* Introduction */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Code className="w-5 h-5 text-primary-600" />
                <h2 className="text-2xl font-bold text-gray-900">Proyecto Open Source</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                <strong>Power Solar Map</strong> es un proyecto de código abierto desarrollado por{" "}
                <strong>Javier Jaramillo</strong>. Creemos en la transparencia, la privacidad del usuario
                y el acceso libre a la información. Esta política explica cómo manejamos los datos en
                nuestra aplicación.
              </p>
            </section>

            {/* Data Collection */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-5 h-5 text-primary-600" />
                <h2 className="text-2xl font-bold text-gray-900">Recopilación de Datos</h2>
              </div>
              <div className="space-y-4 text-gray-700">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Datos que NO recopilamos:</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Información personal identificable (nombre, email, teléfono)</li>
                    <li>Datos de ubicación personal (a menos que el usuario lo permita explícitamente)</li>
                    <li>Cookies de seguimiento o publicidad</li>
                    <li>Datos de navegación o comportamiento del usuario</li>
                    <li>Información de cuentas o registros de usuario</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Datos que utilizamos:</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      <strong>Datos públicos de energía solar:</strong> Utilizamos datos geográficos
                      públicos sobre clientes de energía solar en Puerto Rico. Estos datos son de
                      dominio público y se utilizan únicamente para visualización.
                    </li>
                    <li>
                      <strong>Datos de ubicación del navegador:</strong> Solo si el usuario otorga
                      permiso explícito para usar su ubicación actual en el mapa. Esta información
                      se procesa localmente y no se almacena ni se transmite a servidores externos.
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Data Storage */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-5 h-5 text-primary-600" />
                <h2 className="text-2xl font-bold text-gray-900">Almacenamiento y Seguridad</h2>
              </div>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>No almacenamos datos personales.</strong> Power Solar Map es una aplicación
                  del lado del cliente que procesa datos localmente en su navegador. No tenemos
                  servidores que almacenen información personal de los usuarios.
                </p>
                <p>
                  Todos los datos geográficos utilizados en la aplicación son estáticos y se cargan
                  directamente desde archivos GeoJSON locales o desde fuentes públicas. No se realiza
                  ningún seguimiento ni análisis de comportamiento del usuario.
                </p>
              </div>
            </section>

            {/* Third-Party Services */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Eye className="w-5 h-5 text-primary-600" />
                <h2 className="text-2xl font-bold text-gray-900">Servicios de Terceros</h2>
              </div>
              <div className="space-y-4 text-gray-700">
                <p>
                  Power Solar Map utiliza los siguientes servicios de terceros:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>Mapbox GL JS:</strong> Para renderizar los mapas interactivos. Mapbox
                    puede recopilar datos de uso técnico (como direcciones IP) según su propia
                    política de privacidad. Consulte la{" "}
                    <a
                      href="https://www.mapbox.com/legal/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 underline"
                    >
                      Política de Privacidad de Mapbox
                    </a>
                    .
                  </li>
                  <li>
                    <strong>Mapbox Geocoder:</strong> Para búsquedas de direcciones. Las búsquedas
                    se procesan a través de los servidores de Mapbox.
                  </li>
                </ul>
                <p className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <strong>Nota:</strong> Recomendamos revisar las políticas de privacidad de estos
                  servicios de terceros para entender cómo manejan sus datos.
                </p>
              </div>
            </section>

            {/* Open Source Transparency */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Github className="w-5 h-5 text-primary-600" />
                <h2 className="text-2xl font-bold text-gray-900">Transparencia del Código Abierto</h2>
              </div>
              <div className="space-y-4 text-gray-700">
                <p>
                  Como proyecto de código abierto, todo el código fuente de Power Solar Map está
                  disponible públicamente en GitHub. Esto significa que puede:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Revisar exactamente qué datos se recopilan y cómo se procesan</li>
                  <li>Verificar que no hay código malicioso o de seguimiento oculto</li>
                  <li>Contribuir mejoras o reportar problemas de privacidad</li>
                  <li>Fork el proyecto y ejecutar su propia instancia</li>
                </ul>
                <p>
                  El código está disponible en:{" "}
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 underline font-semibold"
                  >
                    GitHub Repository
                  </a>
                </p>
              </div>
            </section>

            {/* User Rights */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Sus Derechos</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Como usuario de Power Solar Map, tiene los siguientes derechos:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>Acceso:</strong> Puede revisar el código fuente completo en cualquier momento
                  </li>
                  <li>
                    <strong>Control:</strong> Puede desactivar la geolocalización en su navegador
                    en cualquier momento
                  </li>
                  <li>
                    <strong>Transparencia:</strong> Todo el código es público y auditable
                  </li>
                  <li>
                    <strong>Privacidad:</strong> No recopilamos ni almacenamos datos personales
                  </li>
                </ul>
              </div>
            </section>

            {/* Changes to Policy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Cambios a esta Política</h2>
              <p className="text-gray-700">
                Si realizamos cambios significativos a esta política de privacidad, actualizaremos
                la fecha de "Última actualización" en la parte superior de esta página. Como proyecto
                de código abierto, los cambios también se reflejarán en el historial de commits de
                GitHub, proporcionando un registro completo de todas las modificaciones.
              </p>
            </section>

            {/* Contact */}
            <section className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6 border border-primary-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contacto</h2>
              <p className="text-gray-700 mb-4">
                Si tiene preguntas sobre esta política de privacidad o sobre cómo manejamos los datos,
                puede contactarnos a través de:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li>
                  <strong>Desarrollador:</strong> Javier Jaramillo
                </li>
                <li>
                  <strong>Proyecto:</strong>{" "}
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 underline"
                  >
                    GitHub Repository
                  </a>
                </li>
                <li>
                  <strong>Issues:</strong> Puede reportar problemas o preguntas a través de los
                  Issues de GitHub del proyecto
                </li>
              </ul>
            </section>

            {/* Footer Links */}
            <div className="pt-8 border-t border-gray-200 flex flex-wrap gap-4 justify-center">
              <Link
                to="/terminos"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Términos de Servicio
              </Link>
              <Link
                to="/"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Volver al Inicio
              </Link>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-8 text-center text-sm text-gray-600">
            <p>
              © {currentYear} Power Solar Map - Proyecto Open Source desarrollado por{" "}
              <strong>Javier Jaramillo</strong>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Privacidad;

