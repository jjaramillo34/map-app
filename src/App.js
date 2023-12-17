import React from "react";
import "./App.css";
import AppRouter from "./Router";
import { SpeedInsights } from "@vercel/speed-insights/react";

function App() {
  return (
    <div className="App">
      <AppRouter />
      <SpeedInsights />
    </div>
  );
}

export default App;
