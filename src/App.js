import React, { useEffect, useState, useCallback } from "react";
import LatentGrid from "./components/LatentGrid";
import ForecastSites from "./components/ForecastSites";
import RMSEChart from "./components/RMSEChart";

function App() {
    const [activityData, setActivityData] = useState([]);
    const [latentInfo, setLatentInfo] = useState([]);
    const [forecastSites, setForecastSites] = useState([]);
    const [selected, setSelected] = useState(null);
    const [numRows, setNumRows] = useState(10);
    const [selectedSites, setSelectedSites] = useState([]);
    const [sitesRmse, setSitesRmse] = useState({});
    const [rmseHorizon, setRmseHorizon] = useState(0);
    const [focusedSite, setFocusedSite] = useState(null);

    // callback for ForecastSites — made stable with useCallback to avoid infinite re-renders
    // now supports an optional 'focused' param from the child
    const handleSitesUpdate = useCallback((selected, rmseMap, horizon, focused) => {
        setSelectedSites(selected || []);
        setSitesRmse(rmseMap || {});
        setRmseHorizon(horizon || 0);
        setFocusedSite(focused || null);
    }, []);

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
        <div style={{ padding: "1rem", maxWidth: "1600px", margin: "0 auto" }}>
            {/* page-level header removed: LatentGrid shows its own title */}

            <div style={{ display: "flex", gap: "2rem" }}>
                {/* Latent Grid (now includes title/legend) */}
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
                    <ForecastSites sites={forecastSites} onUpdate={handleSitesUpdate} />
                </div>
            </div>

            {/* RMSE Chart area below */}
            <div style={{ marginTop: "1.5rem" }}>
                <RMSEChart
                    sitesRmse={sitesRmse}
                    selectedSites={selectedSites}
                    horizon={rmseHorizon}
                    focusedSiteProp={focusedSite}
                />
            </div>
        </div>
    );
}

export default App;