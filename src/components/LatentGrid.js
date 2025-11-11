import React, { useState } from "react";
import "./LatentGrid.css";

export default function LatentGrid({ activityData = [], latentInfo = [], onInference }) {
    const [selected, setSelected] = useState({ layer: null, dim: null });
    const [topK, setTopK] = useState(6);
    const [latentOffset, setLatentOffset] = useState(0);
    const layerNames = ["Daily", "Weekly", "Biweekly"];

    const handleSelect = (layer, dim) => {
        if (selected.layer === layer && selected.dim === dim) {
            setSelected({ layer: null, dim: null });
            setLatentOffset(0);
        } else {
            setSelected({ layer, dim });
            setLatentOffset(0);
        }
    };

    const handleInference = () => {
        if (onInference && selected.layer !== null) {
            const { layer, dim } = selected;
            onInference(layer, dim, latentOffset);
        }
    };

    const handleTopKChange = (e) => {
        const value = Number(e.target.value);
        if (value > 0 && value <= 24) setTopK(value);
    };

    const getTopIndices = (arr, k) =>
        arr
            .map((val, idx) => ({ val, idx }))
            .sort((a, b) => b.val - a.val)
            .slice(0, k);

    // Return both background color and recommended text color for contrast
    const activityColorAndText = (val, layerActivity) => {
        if (!layerActivity || layerActivity.length === 0) {
            return { bg: "#3b82f6", text: "#fff" };
        }
        const minVal = Math.min(...layerActivity);
        const maxVal = Math.max(...layerActivity);
        const t = (val - minVal) / (maxVal - minVal || 1); // avoid divide by zero

        // interpolate between blue-ish and yellow-ish
        const r = Math.round(59 + t * (253 - 59));
        const g = Math.round(130 + t * (253 - 130));
        const b = Math.round(246 - t * (246 - 71));
        const bg = `rgb(${r},${g},${b})`;

        // compute relative luminance to pick text color (WCAG-friendly simple check)
        // convert sRGB component to linear:
        const srgb = [r / 255, g / 255, b / 255].map((c) =>
            c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
        );
        const luminance = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
        // threshold: if luminance is high use black, else white
        const text = luminance > 0.5 ? "#000" : "#fff";

        return { bg, text };
    };

    return (
        <div className="latent-grid-wrapper">
            {/* Component-owned title */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div>
                    <h3 style={{ margin: 0 }}>Latent Space Activity</h3>
                    <div style={{ fontSize: 18, color: "#555" }}>How much each latent dimension varies over time (higher = more variability)</div>
                </div>

                {/* Legend showing color mapping */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontSize: 18, color: "#555", marginRight: 6 }}>Variability:</div>
                    <div style={{ width: 160, height: 14, borderRadius: 6, background: "linear-gradient(90deg, #3b82f6 0%, #facc15 100%)" }} />
                    <div style={{ fontSize: 18, color: "#333", marginLeft: 6 }}>
                        <span style={{ color: "#3b82f6" }}>Low</span> — <span style={{ color: "#facc15" }}>High</span>
                    </div>
                </div>
            </div>

            <div className="latent-grid-container">
                {layerNames.map((name, layer) => {
                    const layerActivity = activityData[layer] || [];
                    const topDims = getTopIndices(layerActivity, topK);

                    return (
                        <div key={layer} className="latent-column">
                            <h4 className="latent-layer-title">{name}</h4>
                            <div className="latent-column-grid">
                                {topDims.map(({ idx, val }) => {
                                    const isActive = selected.layer === layer && selected.dim === idx;
                                    const mean = latentInfo[layer]?.mean?.[idx] ?? val;
                                    const std = latentInfo[layer]?.std?.[idx] ?? 0;

                                    const displayVal = isActive ? mean + latentOffset * std : val;
                                    const deltaVal = isActive ? (latentOffset * std).toFixed(3) : 0;
                                    const { bg, text } = activityColorAndText(displayVal, layerActivity);

                                    return (
                                        <div
                                            key={idx}
                                            className="latent-cell"
                                            onClick={() => handleSelect(layer, idx)}
                                            style={{
                                                backgroundColor: bg,
                                                border: isActive ? "3px solid black" : "1px solid #ccc",
                                                transform: isActive ? "scale(1.15)" : "scale(1)",
                                                boxShadow: isActive ? "0 0 8px rgba(0,0,0,0.35)" : "none",
                                                transition: "all 0.15s ease-in-out",
                                                cursor: "pointer",
                                                // enforce text color via inline styles on the inner span too
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                width: 64,
                                                height: 30,
                                                fontSize: 13,
                                                fontWeight: 600,
                                            }}
                                            title={`mean: ${mean?.toFixed?.(3) ?? mean}  std: ${std?.toFixed?.(3) ?? std}`}
                                        >
                                            {/* enforce color at the span level (helps override odd UA or CSS rules) */}
                                            <span style={{ color: text, WebkitTextFillColor: text }}>
                                                {idx + 1}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* X / Y axis labels */}
            <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
                <div style={{ fontSize: 13, color: "#333", marginRight: 32 }}>Hierarchical layers (left → right)</div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 6 }}>
                <div style={{ transform: "rotate(-90deg)", transformOrigin: "left top", marginTop: -70, marginLeft: 8, fontSize: 13, color: "#333" }}>
                    Latent dimensions
                </div>
            </div>

            {/* Slider & controls */}
            {selected.layer !== null && latentInfo[selected.layer]?.mean ? (
                <div style={{ marginTop: "1rem" }}>
                    <label>
                        Adjust Latent (-3σ → +3σ):
                        <input
                            type="range"
                            min={-3}
                            max={3}
                            step={0.01}
                            value={latentOffset}
                            onChange={(e) => setLatentOffset(Number(e.target.value))}
                            style={{ width: "70%", marginLeft: "10px" }}
                        />
                    </label>
                    <span style={{ marginLeft: "10px" }}>
                        Δlatent: {(latentOffset * (latentInfo[selected.layer]?.std?.[selected.dim] ?? 0)).toFixed(3)}
                    </span>
                </div>
            ) : null}

            <div className="latent-controls" style={{ marginTop: "1rem" }}>
                <label>
                    Show top
                    <input
                        type="number"
                        min="1"
                        max="24"
                        value={topK}
                        onChange={handleTopKChange}
                        style={{ width: "50px", margin: "0 5px" }}
                    />
                    latents
                </label>
                <button
                    onClick={handleInference}
                    disabled={selected.layer === null}
                    className="inference-btn"
                >
                    Run Inference
                </button>
            </div>
        </div>
    );
}