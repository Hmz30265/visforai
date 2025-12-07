import React, { useEffect, useState, useCallback, useRef } from "react";
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
    const [leftWidth, setLeftWidth] = useState(75); // percentage of container width
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef(null);

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
        fetch("https://visforai-backend.fly.dev/api/latent_activity", {
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
        fetch("https://visforai-backend.fly.dev/api/forecast_sites")
            .then(res => res.json())
            .then(data => setForecastSites(data.sites))
            .catch(err => console.error("Error fetching forecast sites:", err));
    }, []);

    // Handle divider dragging
    const handleMouseDown = (e) => {
        setIsDragging(true);
        e.preventDefault();
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging || !containerRef.current) return;
            
            const container = containerRef.current;
            const rect = container.getBoundingClientRect();
            const newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100;
            
            // Constrain between 20% and 80% to prevent sections from becoming too small
            const constrainedWidth = Math.max(20, Math.min(80, newLeftWidth));
            setLeftWidth(constrainedWidth);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
        }

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };
    }, [isDragging]);

    return (
        <div style={{ padding: "1rem", maxWidth: "1600px", margin: "0 auto" }}>
            {/* page-level header removed: LatentGrid shows its own title */}

            <div 
                ref={containerRef}
                style={{ 
                    display: "flex", 
                    position: "relative",
                    width: "100%"
                }}
            >
                {/* Latent Grid (now includes title/legend) */}
                <div style={{ 
                    width: `${leftWidth}%`,
                    minWidth: "300px",
                    paddingRight: "8px"
                }}>
                    <LatentGrid
                        activityData={activityData.slice(0, numRows)}
                        latentInfo={latentInfo.slice(0, numRows)}
                        onInference={(layer, dim, offset) =>
                            console.log("Inference:", layer, dim, offset)
                        }
                    />
                </div>

                {/* Draggable Divider */}
                <div
                    onMouseDown={handleMouseDown}
                    style={{
                        width: "8px",
                        cursor: "col-resize",
                        backgroundColor: isDragging ? "#3b82f6" : "#e5e7eb",
                        position: "relative",
                        flexShrink: 0,
                        transition: isDragging ? "none" : "background-color 0.2s",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            width: "4px",
                            height: "40px",
                            backgroundColor: "#9ca3af",
                            borderRadius: "2px",
                        }}
                    />
                </div>

                {/* Forecast Sites */}
                <div style={{ 
                    width: `${100 - leftWidth}%`,
                    minWidth: "300px",
                    paddingLeft: "8px"
                }}>
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