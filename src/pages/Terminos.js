import React from "react";
import Layout from "../components/Layout";
import { FileText, Scale, Code, Github, AlertTriangle, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const Terminos = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl mb-6">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Términos de Servicio
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
                <strong>Javier Jaramillo</strong>. Al utilizar esta aplicación, acepta los siguientes
                términos de servicio. Estos términos reflejan los valores del código abierto: transparencia,
                colaboración y uso libre.
              </p>
            </section>

            {/* Acceptance */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Aceptación de los Términos</h2>
              <p className="text-gray-700">
                Al acceder y utilizar Power Solar Map, usted acepta cumplir con estos términos de servicio.
                Si no está de acuerdo con alguna parte de estos términos, no debe utilizar la aplicación.
              </p>
            </section>

            {/* License */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Scale className="w-5 h-5 text-primary-600" />
                <h2 className="text-2xl font-bold text-gray-900">Licencia de Código Abierto</h2>
              </div>
              <div className="space-y-4 text-gray-700">
                <p>
                  El código fuente de Power Solar Map está disponible bajo una licencia de código abierto.
                  Consulte el archivo LICENSE en el repositorio de GitHub para los detalles completos de
                  la licencia.
                </p>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-green-900 mb-1">Usted puede:</p>
                      <ul className="list-disc list-inside space-y-1 text-green-800 ml-4">
                        <li>Usar la aplicación libremente</li>
                        <li>Copiar y modificar el código</li>
                        <li>Distribuir versiones modificadas</li>
                        <li>Contribuir mejoras al proyecto</li>
                        <li>Usar el código en proyectos comerciales (según la licencia específica)</li>
                      </ul>
                    </div>
                  </div>
                </div>
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

            {/* Use of Service */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Uso del Servicio</h2>
              <div className="space-y-4 text-gray-700">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Uso Permitido:</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Visualizar y explorar datos de energía solar en Puerto Rico</li>
                    <li>Utilizar la aplicación para fines educativos, de investigación o comerciales</li>
                    <li>Integrar funcionalidades en otros proyectos (respetando la licencia)</li>
                    <li>Compartir enlaces a la aplicación</li>
                  </ul>
                </div>
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-red-900 mb-1">Uso Prohibido:</p>
                      <ul className="list-disc list-inside space-y-1 text-red-800 ml-4">
                        <li>Intentar acceder a sistemas o datos no autorizados</li>
                        <li>Usar la aplicación para actividades ilegales</li>
                        <li>Modificar o eliminar avisos de derechos de autor</li>
                        <li>Usar la aplicación de manera que pueda dañar o sobrecargar los servidores</li>
                        <li>Violar los términos de servicio de servicios de terceros (como Mapbox)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Data and Accuracy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Datos y Precisión</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>Precisión de los Datos:</strong> Power Solar Map utiliza datos públicos y
                  de terceros para visualización. No garantizamos la exactitud, integridad o actualidad
                  de los datos mostrados. Los datos se proporcionan "tal cual" sin garantías de ningún tipo.
                </p>
                <p>
                  <strong>Uso de los Datos:</strong> Los datos mostrados en la aplicación son para
                  fines informativos y de visualización únicamente. No deben utilizarse como única
                  fuente para decisiones comerciales, legales o financieras importantes.
                </p>
              </div>
            </section>

            {/* Third-Party Services */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Servicios de Terceros</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Power Solar Map utiliza servicios de terceros, incluyendo:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>Mapbox:</strong> Para mapas y geocodificación. Su uso está sujeto a los{" "}
                    <a
                      href="https://www.mapbox.com/legal/tos"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 underline"
                    >
                      Términos de Servicio de Mapbox
                    </a>
                    .
                  </li>
                </ul>
                <p>
                  Al utilizar Power Solar Map, también acepta cumplir con los términos de servicio de
                  estos proveedores de terceros.
                </p>
              </div>
            </section>

            {/* Disclaimer */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Descargo de Responsabilidad</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>Power Solar Map se proporciona "TAL CUAL" y "SEGÚN DISPONIBILIDAD"</strong>,
                  sin garantías de ningún tipo, expresas o implícitas, incluyendo pero no limitándose
                  a garantías de comerciabilidad, idoneidad para un propósito particular y no infracción.
                </p>
                <p>
                  En ningún caso los desarrolladores o colaboradores de Power Solar Map serán responsables
                  de ningún daño directo, indirecto, incidental, especial, consecuente o punitivo
                  que resulte del uso o la imposibilidad de usar la aplicación.
                </p>
              </div>
            </section>

            {/* Contributions */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Github className="w-5 h-5 text-primary-600" />
                <h2 className="text-2xl font-bold text-gray-900">Contribuciones</h2>
              </div>
              <div className="space-y-4 text-gray-700">
                <p>
                  Agradecemos las contribuciones a Power Solar Map. Al contribuir código, documentación,
                  o cualquier otro material al proyecto:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Usted otorga permiso para usar su contribución bajo la licencia del proyecto</li>
                  <li>Usted garantiza que tiene los derechos necesarios para contribuir el material</li>
                  <li>Usted acepta que sus contribuciones pueden ser revisadas, modificadas o rechazadas</li>
                  <li>Usted acepta que las contribuciones se harán públicas en el repositorio</li>
                </ul>
              </div>
            </section>

            {/* Modifications */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Modificaciones a los Términos</h2>
              <p className="text-gray-700">
                Nos reservamos el derecho de modificar estos términos de servicio en cualquier momento.
                Los cambios se reflejarán en esta página y en el repositorio de GitHub. El uso continuado
                de la aplicación después de los cambios constituye su aceptación de los nuevos términos.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Terminación</h2>
              <p className="text-gray-700">
                Como proyecto de código abierto, Power Solar Map está disponible públicamente. Sin embargo,
                nos reservamos el derecho de restringir el acceso a versiones alojadas si se violan estos
                términos. Los usuarios siempre pueden ejecutar su propia instancia del código fuente.
              </p>
            </section>

            {/* Contact */}
            <section className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6 border border-primary-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contacto</h2>
              <p className="text-gray-700 mb-4">
                Si tiene preguntas sobre estos términos de servicio, puede contactarnos a través de:
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
                to="/privacidad"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Política de Privacidad
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

export default Terminos;

