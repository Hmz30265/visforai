// filepath: /home/a/College/8615_f25/vis4hof/src/components/ForecastSites.js
import React, { useState, useEffect, useRef, useMemo } from "react";

/*
    Props:
    - sites: array of site ids
    - onUpdate(selectedSitesArray, sitesRmseMap, horizon)
*/
export default function ForecastSites({ sites = [], onUpdate = () => {} }) {
    const [selected, setSelected] = useState([]); // strings
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sitesRmse, setSitesRmse] = useState({});
    const debounceRef = useRef(null);

    // Generate random positions for each site (memoized to keep positions stable)
    const sitePositions = useMemo(() => {
        const positions = {};
        sites.forEach((site) => {
            const s = String(site);
            // Generate random positions with some padding from edges (5% to 95% of container)
            positions[s] = {
                left: `${5 + Math.random() * 90}%`,
                top: `${5 + Math.random() * 90}%`,
            };
        });
        return positions;
    }, [sites]);

    useEffect(() => {
        // Debounce RMSE fetch to avoid chattiness when toggling many sites quickly
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchRmse();
        }, 200);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
        // only depends on selected
    }, [selected]);

    useEffect(() => {
        // notify parent whenever rmse or selection updates
        onUpdate(selected, sitesRmse, Object.values(sitesRmse)[0]?.length || 0);
    }, [selected, sitesRmse, onUpdate]);

    const fetchRmse = async () => {
        if (selected.length === 0) {
            setSitesRmse({});
            onUpdate([], {}, 0);
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

            {/* Map container with site buttons positioned on it */}
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "0",
                    paddingBottom: "75%", // Maintain aspect ratio (4:3)
                    backgroundImage: "url(/map.jpg)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    border: "2px solid #ccc",
                    borderRadius: 8,
                    marginBottom: "12px",
                }}
            >
                {/* Inner container for absolutely positioned buttons */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                    }}
                >
                    {sites.map((site) => {
                        const s = String(site);
                        const isSelected = selected.includes(s);
                        const position = sitePositions[s] || { left: "50%", top: "50%" };
                        return (
                            <button
                                key={s}
                                onClick={() => handleClick(s)}
                                title={`${s} - Click to toggle selection`}
                                style={{
                                    position: "absolute",
                                    left: position.left,
                                    top: position.top,
                                    transform: "translate(-50%, -50%)",
                                    padding: "6px 10px",
                                    background: isSelected ? "#bfdbfe" : "#f3f4f6",
                                    color: "#111827",
                                    border: isSelected ? "2px solid #0832a8" : "1px solid #ddd",
                                    borderRadius: 6,
                                    cursor: "pointer",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                                    fontWeight: isSelected ? "bold" : "normal",
                                    zIndex: isSelected ? 10 : 1,
                                    transition: "all 0.2s ease",
                                }}
                            >
                                {s}
                            </button>
                        );
                    })}
                </div>
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
