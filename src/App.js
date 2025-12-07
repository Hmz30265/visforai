import React, { useEffect, useState, useCallback } from "react";
import LatentGrid, { LatentDistributionDetail } from "./components/LatentGrid";
import ForecastSites from "./components/ForecastSites";
import RMSEChart from "./components/RMSEChart";

function App() {
    const [activityData, setActivityData] = useState([]);
    const [latentInfo, setLatentInfo] = useState([]);
    const [forecastSites, setForecastSites] = useState([]);
    const [selectedSites, setSelectedSites] = useState([]);
    const [sitesRmse, setSitesRmse] = useState({});
    const [rmseHorizon, setRmseHorizon] = useState(0);
    const [focusedSite, setFocusedSite] = useState(null);
    const [selectedDim, setSelectedDim] = useState({ layer: null, dim: null });
    const [inferenceResults, setInferenceResults] = useState({});
    const [isInferenceRunning, setIsInferenceRunning] = useState(false);

    const handleSitesUpdate = useCallback((selected, rmseMap, horizon) => {
        console.log("handleSitesUpdate called:", { selected, rmseMap, horizon });
        setSelectedSites(selected || []);
        setSitesRmse(rmseMap || {});
        setRmseHorizon(horizon || 0);
    }, []);

    // New callback for when RMSEChart changes the focused site
    const handleFocusedSiteChange = useCallback((site) => {
        console.log("Focused site changed to:", site);
        setFocusedSite(site);
    }, []);

    // Auto-set focused site when only one site is selected
    useEffect(() => {
        if (selectedSites.length === 1 && focusedSite === null) {
            const site = selectedSites[0];
            console.log("Auto-focusing single selected site:", site);
            setFocusedSite(site);
        }
    }, [selectedSites, focusedSite]);

    const handleInference = useCallback(async (layer, dim, offset) => {
        console.log("handleInference called:", { focusedSite, layer, dim, offset });
        
        // Validate inputs
        if (focusedSite === null || focusedSite === undefined) {
            alert("Please select a site first");
            return;
        }

        if (layer === null || dim === null) {
            alert("Please select a latent dimension first");
            return;
        }

        setIsInferenceRunning(true);

        try {
            // Convert focusedSite to integer (it might be a string)
            const siteIdx = parseInt(focusedSite, 10);
            
            console.log("Sending inference request:", { site_idx: siteIdx, layer, dim, offset });
            
            const response = await fetch("https://visforai-backend.fly.dev/api/inference", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    site_idx: siteIdx,
                    layer: layer,
                    dim: dim,
                    offset: offset
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Store the inference results
            setInferenceResults(prev => ({
                ...prev,
                [focusedSite]: {
                    predictions: data.shifted_pred,
                    layer: layer,
                    dim: dim,
                    offset: offset,
                    timestamp: new Date().toISOString()
                }
            }));

            console.log(`Inference complete for site ${focusedSite}:`, data);
            
        } catch (err) {
            console.error("Error running inference:", err);
            alert(`Error running inference: ${err.message}`);
        } finally {
            setIsInferenceRunning(false);
        }
    }, [focusedSite]);

    useEffect(() => {
        fetch("https://visforai-backend.fly.dev/api/latent_activity", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
        })
            .then(res => res.json())
            .then(data => {
                console.log("Loaded latent activity:", data.activity);
                setActivityData(data.activity);
                setLatentInfo(data.latent_info);
            })
            .catch(err => console.error("Error fetching latent activity:", err));
    }, []);

    useEffect(() => {
        fetch("https://visforai-backend.fly.dev/api/forecast_sites")
            .then(res => res.json())
            .then(data => setForecastSites(data.sites))
            .catch(err => console.error("Error fetching forecast sites:", err));
    }, []);

    return (
        <div style={{ padding: "1rem", maxWidth: "1600px", margin: "0 auto" }}>
            {/* Debug info */}
            <div style={{ 
                padding: "0.5rem 1rem", 
                backgroundColor: "#f0f9ff", 
                borderRadius: "4px",
                marginBottom: "1rem",
                fontSize: "14px",
                fontFamily: "monospace"
            }}>
                <strong>Debug:</strong> focusedSite = {focusedSite !== null ? focusedSite : 'null'}
            </div>

            <div style={{ display: "flex", gap: "2rem" }}>
                {/* Latent Grid */}
                <div style={{ flex: 3 }}>
                    <LatentGrid
                        activityData={activityData}
                        latentInfo={latentInfo}
                        focusedSite={focusedSite}
                        onInference={handleInference}
                        onSelectDimension={setSelectedDim}
                        isInferenceRunning={isInferenceRunning}
                    />
                </div>

                {/* Detailed Distribution in the middle */}
                <div style={{ flex: 2 }}>
                    <LatentDistributionDetail
                        selectedDim={selectedDim}
                        latentInfo={latentInfo}
                    />
                </div>

                {/* Forecast Sites */}
                <div style={{ flex: 1, borderLeft: "1px solid #ccc", paddingLeft: "1rem" }}>
                    <ForecastSites sites={forecastSites} onUpdate={handleSitesUpdate} />
                </div>
            </div>

            {/* RMSE Chart */}
            <div style={{ marginTop: "1.5rem" }}>
                <RMSEChart
                    sitesRmse={sitesRmse}
                    selectedSites={selectedSites}
                    horizon={rmseHorizon}
                    focusedSiteProp={focusedSite}
                    onFocusedSiteChange={handleFocusedSiteChange}
                    inferenceResults={inferenceResults[focusedSite]}
                />
            </div>

            {/* Optional: Display inference results */}
            {inferenceResults[focusedSite] && (
                <div style={{
                    marginTop: "1.5rem",
                    padding: "1rem",
                    backgroundColor: "#f0f9ff",
                    borderRadius: "8px",
                    border: "1px solid #0ea5e9"
                }}>
                    <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "18px" }}>
                        Latest Inference for Site {focusedSite}
                    </h3>
                    <div style={{ fontSize: "14px", color: "#666", marginBottom: "0.5rem" }}>
                        Layer: {inferenceResults[focusedSite].layer}, 
                        Dim: {inferenceResults[focusedSite].dim}, 
                        Offset: {inferenceResults[focusedSite].offset}σ
                    </div>
                    <div style={{ fontSize: "13px", color: "#666" }}>
                        Predictions length: {inferenceResults[focusedSite].predictions?.length || 0} timesteps
                    </div>
                    <div style={{ fontSize: "12px", color: "#999", marginTop: "0.5rem" }}>
                        View the shifted prediction overlaid on the detailed forecast plot above
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;