// filepath: /home/a/College/8615_f25/vis4hof/src/components/ForecastSites.js
import React, { useState, useEffect, useRef } from "react";

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
            const res = await fetch(`http://localhost:5000/api/sites_rmse?sites=${encodeURIComponent(q)}`);
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

            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                {sites.map((site) => {
                    const s = String(site);
                    const isSelected = selected.includes(s);
                    return (
                        <button
                            key={s}
                            onClick={() => handleClick(s)}
                            title="Click to toggle selection"
                            style={{
                                padding: "6px 10px",
                                background: isSelected ? "#bfdbfe" : "#f3f4f6",
                                color: "#111827",
                                border: isSelected ? "2px solid #0832a8" : "1px solid #ddd",
                                borderRadius: 6,
                                cursor: "pointer",
                            }}
                        >
                            {s}
                        </button>
                    );
                })}
            </div>

            <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>
                {selected.length === 0 ? "Click site buttons to select multiple sites." : `${selected.length} site(s) selected.`}
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <button onClick={clearAll} style={{ padding: "6px 8px" }}>Clear</button>
                {loading ? <div style={{ fontSize: 13 }}>Loading RMSE...</div> : null}
                {error ? <div style={{ color: "red", fontSize: 13 }}>{error}</div> : null}
            </div>
        </div>
    );
}
