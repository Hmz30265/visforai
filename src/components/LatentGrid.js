import React, { useState } from "react";
import "./LatentGrid.css";

export default function LatentGrid({ activityData = [], latentInfo = [], onInference }) {
    const [selected, setSelected] = useState({ layer: null, dim: null });
    const [hovered, setHovered] = useState({ layer: null, dim: null, position: null });
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

    const handleMouseEnter = (layer, dim, event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setHovered({ layer, dim, position: { x: rect.left + rect.width / 2, y: rect.top } });
    };

    const handleMouseLeave = () => {
        setHovered({ layer: null, dim: null, position: null });
    };

    // Calculate Gaussian distribution values
    const gaussian = (x, mean, std) => {
        if (!std || std === 0) return 0;
        const variance = std * std;
        return Math.exp(-0.5 * Math.pow((x - mean) / std, 2)) / (std * Math.sqrt(2 * Math.PI));
    };

    // Generate Gaussian curve data points
    const getGaussianCurve = (mean, std, numPoints = 100) => {
        if (!std || std === 0) return [];
        const range = 6 * std; // ±3σ range
        const min = mean - range / 2;
        const max = mean + range / 2;
        const step = range / numPoints;
        const points = [];
        let maxY = 0;

        for (let i = 0; i <= numPoints; i++) {
            const x = min + i * step;
            const y = gaussian(x, mean, std);
            points.push({ x, y });
            if (y > maxY) maxY = y;
        }

        return { points, maxY, min, max };
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
                                    const mean = Number(latentInfo[layer]?.mean?.[idx]) || val;
                                    const std = Number(latentInfo[layer]?.std?.[idx]) || 0;

                                    const displayVal = isActive ? mean + latentOffset * std : val;
                                    const deltaVal = isActive ? (latentOffset * std).toFixed(3) : 0;
                                    const { bg, text } = activityColorAndText(displayVal, layerActivity);

                                    return (
                                        <div
                                            key={idx}
                                            className="latent-cell"
                                            onClick={() => handleSelect(layer, idx)}
                                            onMouseEnter={(e) => handleMouseEnter(layer, idx, e)}
                                            onMouseLeave={handleMouseLeave}
                                            style={{
                                                backgroundColor: bg,
                                                border: isActive ? "3px solid black" : "1px solid #ccc",
                                                transform: isActive ? "scale(1.15)" : "scale(1)",
                                                boxShadow: isActive ? "0 0 8px rgba(0,0,0,0.35)" : "none",
                                                transition: "all 0.15s ease-in-out",
                                                cursor: "pointer",
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
                        Δlatent: {(latentOffset * (Number(latentInfo[selected.layer]?.std?.[selected.dim]) || 0)).toFixed(3)}
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

            {/* Gaussian Distribution Tooltip */}
            {hovered.layer !== null && hovered.dim !== null && hovered.position && latentInfo[hovered.layer]?.mean && (
                <div
                    style={{
                        position: "fixed",
                        left: `${hovered.position.x + 40}px`,
                        top: `${hovered.position.y + 40}px`,
                        zIndex: 1000,
                        background: "white",
                        border: "2px solid #333",
                        borderRadius: "8px",
                        padding: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        pointerEvents: "none",
                    }}
                >
                    <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px", textAlign: "center" }}>
                        Layer {hovered.layer + 1} - Dim {hovered.dim + 1}
                    </div>
                    {(() => {
                        let hoverMean = Number(latentInfo[hovered.layer]?.mean?.[hovered.dim]) || 0;
                        let hoverStd = Number(latentInfo[hovered.layer]?.std?.[hovered.dim]) || 0;
                        
                        // If both mean and std are zero, show default standard normal distribution
                        if (hoverMean === 0 && hoverStd === 0) {
                            hoverMean = 0;
                            hoverStd = 1;
                        }
                        
                        const curveData = getGaussianCurve(hoverMean, hoverStd, 150);
                        
                        if (!curveData.points || curveData.points.length === 0) {
                            return <div style={{ fontSize: "11px", color: "#666" }}>No distribution data</div>;
                        }

                        const width = 280;
                        const height = 160;
                        const padding = { top: 20, right: 20, bottom: 40, left: 50 };
                        const innerWidth = width - padding.left - padding.right;
                        const innerHeight = height - padding.top - padding.bottom;

                        const xScale = (x) => padding.left + ((x - curveData.min) / (curveData.max - curveData.min)) * innerWidth;
                        const yScale = (y) => padding.top + innerHeight - (y / curveData.maxY) * innerHeight;

                        // Build path for the curve
                        const pathData = curveData.points
                            .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.x)} ${yScale(p.y)}`)
                            .join(" ");

                        // Mark mean position
                        const meanX = xScale(hoverMean);
                        const meanY = yScale(gaussian(hoverMean, hoverMean, hoverStd));

                        return (
                            <svg width={width} height={height} style={{ display: "block" }}>
                                {/* Background */}
                                <rect x={0} y={0} width={width} height={height} fill="white" />
                                
                                {/* Grid lines */}
                                <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + innerHeight} stroke="#e5e7eb" />
                                <line x1={padding.left} y1={padding.top + innerHeight} x2={padding.left + innerWidth} y2={padding.top + innerHeight} stroke="#e5e7eb" />
                                
                                {/* Y-axis ticks */}
                                {[0, 0.5, 1].map((t) => {
                                    const y = padding.top + innerHeight - t * innerHeight;
                                    const val = (curveData.maxY * t).toFixed(3);
                                    return (
                                        <g key={t}>
                                            <line x1={padding.left - 4} x2={padding.left} y1={y} y2={y} stroke="#ccc" />
                                            <text x={padding.left - 8} y={y + 3} fontSize="9" textAnchor="end" fill="#666">{val}</text>
                                        </g>
                                    );
                                })}
                                
                                {/* X-axis ticks */}
                                {[-3, -2, -1, 0, 1, 2, 3].map((sigma) => {
                                    const x = hoverMean + sigma * hoverStd;
                                    const xPos = xScale(x);
                                    if (xPos < padding.left || xPos > padding.left + innerWidth) return null;
                                    return (
                                        <g key={sigma}>
                                            <line x1={xPos} y1={padding.top + innerHeight} x2={xPos} y2={padding.top + innerHeight + 4} stroke="#ccc" />
                                            <text x={xPos} y={padding.top + innerHeight + 16} fontSize="9" textAnchor="middle" fill="#666">
                                                {sigma === 0 ? "μ" : `${sigma}σ`}
                                            </text>
                                        </g>
                                    );
                                })}
                                
                                {/* Gaussian curve */}
                                <path
                                    d={pathData}
                                    fill="none"
                                    stroke="#3b82f6"
                                    strokeWidth="2"
                                />
                                
                                {/* Fill under curve */}
                                <path
                                    d={`${pathData} L ${xScale(curveData.max)} ${padding.top + innerHeight} L ${xScale(curveData.min)} ${padding.top + innerHeight} Z`}
                                    fill="#3b82f6"
                                    fillOpacity="0.1"
                                />
                                
                                {/* Mean line */}
                                <line
                                    x1={meanX}
                                    y1={padding.top}
                                    x2={meanX}
                                    y2={padding.top + innerHeight}
                                    stroke="#ef4444"
                                    strokeWidth="1.5"
                                    strokeDasharray="4 2"
                                />
                                
                                {/* Mean marker */}
                                <circle cx={meanX} cy={meanY} r="4" fill="#ef4444" />
                                
                                {/* Labels */}
                                <text x={padding.left + innerWidth / 2} y={height - 8} fontSize="10" textAnchor="middle" fill="#333">
                                    Latent Value
                                </text>
                                <text x={12} y={padding.top + innerHeight / 2} fontSize="10" textAnchor="middle" transform={`rotate(-90 12 ${padding.top + innerHeight / 2})`} fill="#333">
                                    Probability Density
                                </text>
                                
                                {/* Stats text */}
                                <text x={padding.left + innerWidth / 2} y={padding.top - 4} fontSize="10" textAnchor="middle" fill="#333" fontWeight="bold">
                                    μ={hoverMean.toFixed(3)}, σ={hoverStd.toFixed(3)}
                                </text>
                            </svg>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}