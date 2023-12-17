import React from "react";
import "./App.css";
import AppRouter from "./Router";
import { SpeedInsights } from "@vercel/speed-insights/next";

function App() {
  return (
    <div className="App">
      <AppRouter />
    </div>
  );
}

export default App;
