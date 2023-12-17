import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LandingPage from "./MapBoxComponent";
import Mapa from "./Mapa";
import Municipios from "./Municipios";

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/mapa" element={<Mapa />} />
        <Route path="municipios/" element={<Municipios />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
