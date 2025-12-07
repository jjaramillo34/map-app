import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Mapa from "./pages/Mapa";
import Municipios from "./pages/Municipios";
import ClusterMap from "./pages/ClusterMap";
import HeatMap from "./pages/HeatMap";
import Map3D from "./pages/Map3D";
import AnalyticsPage from "./pages/AnalyticsPage";
import Privacidad from "./pages/Privacidad";
import Terminos from "./pages/Terminos";
import MunicipioDetail from "./pages/MunicipioDetail";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProtectedRoute from "./components/AdminProtectedRoute";

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/mapa" element={<Mapa />} />
        <Route path="/municipios" element={<Municipios />} />
        <Route path="/cluster" element={<ClusterMap />} />
        <Route path="/heatmap" element={<HeatMap />} />
        <Route path="/3d" element={<Map3D />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/privacidad" element={<Privacidad />} />
        <Route path="/terminos" element={<Terminos />} />
        <Route path="/municipio/:municipioName" element={<MunicipioDetail />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default AppRouter;
