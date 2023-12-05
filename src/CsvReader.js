import React, { useState, useEffect } from "react";
import Papa from "papaparse";

const CSVReader = ({ onPointsLoaded }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Papa.parse("/data_v1.csv", {
      download: true,
      header: true,
      complete: (results) => {
        const points = results.data
          .filter((row) => row.latitude && row.longitude) // Filter out rows without valid lat/lng
          .map((row) => ({
            lat: parseFloat(row.latitude),
            lng: parseFloat(row.longitude),
          }));

        onPointsLoaded(points);
        setLoading(false);
      },
      error: () => {
        // Handle error
        setLoading(false);
      },
    });
  }, [onPointsLoaded]);

  if (loading) {
    return <div>Loading CSV data...</div>;
  }

  return <div>CSV Data Loaded</div>;
};

export default CSVReader;
