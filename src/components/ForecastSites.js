import React, { useState, useEffect, useRef, useMemo } from "react";

/*
    Props:
    - sites: array of site ids
    - onUpdate(selectedSitesArray, sitesRmseMap, horizon)
*/

// Simple seeded random number generator for consistent positions
function seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

export default function ForecastSites({ sites = [], onUpdate = () => {}, containerWidth = 300 }) {
    const [selected, setSelected] = useState([]); // strings
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sitesRmse, setSitesRmse] = useState({});
    const debounceRef = useRef(null);
    const mapContainerRef = useRef(null);
    const [mapDimensions, setMapDimensions] = useState({ width: 300, height: 200 });

    // Update map dimensions when container width changes
    useEffect(() => {
        if (mapContainerRef.current) {
            const width = Math.max(200, containerWidth - 40); // Account for padding
            const height = Math.max(200, width * 0.67); // Maintain aspect ratio (3:2)
            setMapDimensions({ width, height });
        }
    }, [containerWidth]);

    // Generate random positions for each site (consistent based on site ID)
    const sitePositions = useMemo(() => {
        const positions = {};
        const padding = 40;
        const maxX = mapDimensions.width - padding;
        const maxY = mapDimensions.height - padding;
        
        sites.forEach((site) => {
            const s = String(site);
            // Use site ID as seed for consistent positioning
            const seed = s.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            // Generate random position within map bounds (with padding)
            positions[s] = {
                x: padding + seededRandom(seed) * (maxX - padding),
                y: padding + seededRandom(seed + 1000) * (maxY - padding),
            };
        });
        return positions;
    }, [sites, mapDimensions]);

    useEffect(() => {
        // Debounce RMSE fetch to avoid chattiness when toggling many sites quickly
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchRmse();
        }, 200);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [selected]);

    useEffect(() => {
        // notify parent whenever rmse or selection updates
        onUpdate(selected, sitesRmse, Object.values(sitesRmse)[0]?.length || 0);
    }, [selected, sitesRmse, onUpdate]);

    const fetchRmse = async () => {
        if (selected.length === 0) {
            setSitesRmse({});
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const q = selected.join(",");
            const res = await fetch(`https://visforai-backend.fly.dev/api/sites_rmse?sites=${encodeURIComponent(q)}`);
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Error fetching RMSE");
                setSitesRmse({});
            } else {
                setSitesRmse(data.sites_rmse || {});
            }
        } catch (err) {
            setError(String(err));
            setSitesRmse({});
        } finally {
            setLoading(false);
        }
    };

    const handleClick = (site) => {
        const s = String(site);
        // Regular click => toggle selection
        setSelected(prev => (prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]));
    };

    const clearAll = () => {
        setSelected([]);
    };

    return (
        <div>
            <h3>Forecast Sites</h3>

            {/* Map container with buttons positioned on it */}
            <div 
                ref={mapContainerRef}
                style={{ 
                    position: "relative",
                    width: `${mapDimensions.width}px`,
                    height: `${mapDimensions.height}px`,
                    marginBottom: "8px",
                    border: "1px solid #ddd",
                    borderRadius: 6,
                    overflow: "hidden",
                    backgroundImage: "url(/map.jpg)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat"
                }}
            >
                {sites.map((site) => {
                    const s = String(site);
                    const isSelected = selected.includes(s);
                    const position = sitePositions[s] || { x: 50, y: 50 };
                    return (
                        <button
                            key={s}
                            onClick={() => handleClick(s)}
                            title={`Site ${s} - Click to toggle selection`}
                            style={{
                                position: "absolute",
                                left: `${position.x}px`,
                                top: `${position.y}px`,
                                transform: "translate(-50%, -50%)",
                                padding: "6px 10px",
                                background: isSelected ? "#bfdbfe" : "#f3f4f6",
                                color: "#111827",
                                border: isSelected ? "2px solid #0832a8" : "1px solid #ddd",
                                borderRadius: 6,
                                cursor: "pointer",
                                boxShadow: isSelected ? "0 2px 4px rgba(0,0,0,0.3)" : "0 1px 2px rgba(0,0,0,0.2)",
                                zIndex: isSelected ? 10 : 5,
                                fontSize: "12px",
                                fontWeight: isSelected ? "600" : "400",
                            }}
                        >
                            {s}
                        </button>
                    );
                })}
            </div>

            <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>
                {selected.length === 0 ? "Click site buttons on the map to select multiple sites." : `${selected.length} site(s) selected.`}
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <button onClick={clearAll} style={{ padding: "6px 8px" }}>Clear</button>
                {loading ? <div style={{ fontSize: 13 }}>Loading RMSE...</div> : null}
                {error ? <div style={{ color: "red", fontSize: 13 }}>{error}</div> : null}
            </div>
        </div>
    );
}