import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const PAGE_TITLES = {
  "/": "Power Solar Map | Clientes de energía solar en Puerto Rico",
  "/mapa": "Mapa interactivo | Power Solar Map",
  "/municipios": "Municipios | Power Solar Map",
  "/cluster": "Mapa de clusters | Power Solar Map",
  "/heatmap": "Mapa de calor | Power Solar Map",
  "/3d": "Mapa 3D | Power Solar Map",
  "/oportunidad": "Mapa de oportunidad | Power Solar Map",
  "/analytics": "Analytics | Power Solar Map",
  "/privacidad": "Privacidad | Power Solar Map",
  "/terminos": "Términos | Power Solar Map",
  "/admin": "Admin | Power Solar Map",
  "/admin/dashboard": "Panel de administración | Power Solar Map",
};

const DocumentTitle = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname.startsWith("/municipio/")) {
      const name = decodeURIComponent(pathname.split("/")[2] || "").trim();
      document.title = name
        ? `${name} | Power Solar Map`
        : "Municipio | Power Solar Map";
      return;
    }

    document.title = PAGE_TITLES[pathname] || "Power Solar Map";
  }, [pathname]);

  return null;
};

export default DocumentTitle;
