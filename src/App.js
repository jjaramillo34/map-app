import React, { useState } from "react";
import MapBoxComponent from "./MapBoxComponent";
import "mapbox-gl/dist/mapbox-gl.css"; // Import Mapbox CSS

const App = () => {
  return (
    <div className="App">
      <MapBoxComponent />
    </div>
  );
};

export default App;
