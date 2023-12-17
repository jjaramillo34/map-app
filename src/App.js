import React from "react";
import "./App.css";
import AppRouter from "./Router";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";

function App() {
  return (
    <div className="App">
      <AppRouter />
      <SpeedInsights />
      <Analytics />
    </div>
  );
}

export default App;
