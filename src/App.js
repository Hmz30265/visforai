import React, { useEffect, useState } from "react";
import LatentGrid from "./components/LatentGrid";

function App() {
  const [activityData, setActivityData] = useState([]);
  const [latentInfo, setLatentInfo] = useState([]);
  const [forecastSites, setForecastSites] = useState([]);
  const [selected, setSelected] = useState(null);
  const [numRows, setNumRows] = useState(10);

  // 🔹 Fetch latent activity + latent info
  useEffect(() => {
    fetch("http://localhost:5000/api/latent_activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}) // backend uses forecast_sites directly
    })
      .then(res => res.json())
      .then(data => {
        console.log("Loaded latent activity:", data.activity);
        setActivityData(data.activity);
        setLatentInfo(data.latent_info);
      })
      .catch(err => console.error("Error fetching latent activity:", err));
  }, []);

  // 🔹 Fetch forecast sites
  useEffect(() => {
    fetch("http://localhost:5000/api/forecast_sites")
      .then(res => res.json())
      .then(data => setForecastSites(data.sites))
      .catch(err => console.error("Error fetching forecast sites:", err));
  }, []);

  return (
    <div style={{ padding: "1rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h2>Latent Space Activity Viewer</h2>

      <div style={{ display: "flex", gap: "2rem" }}>
        {/* Latent Grid */}
        <div style={{ flex: 3 }}>
          <LatentGrid
            activityData={activityData.slice(0, numRows)}
            latentInfo={latentInfo.slice(0, numRows)}
            onInference={(layer, dim, offset) =>
              console.log("Inference:", layer, dim, offset)
            }
          />
        </div>

        {/* Forecast Sites */}
        <div style={{ flex: 1, borderLeft: "1px solid #ccc", paddingLeft: "1rem" }}>
          <h3>Forecast Sites</h3>
          <ul>
            {forecastSites.map(site => (
              <li key={site}>{site}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
