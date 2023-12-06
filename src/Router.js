import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LandingPage from "./MapBoxComponent";
import Mapa from "./Mapa";

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/mapa" element={<Mapa />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
