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

  const activityToColor = (val, layerActivity) => {
    if (!layerActivity || layerActivity.length === 0) return "#3b82f6";
    const minVal = Math.min(...layerActivity);
    const maxVal = Math.max(...layerActivity);
    const t = (val - minVal) / (maxVal - minVal || 1); // avoid divide by zero
    const r = Math.round(59 + t * (253 - 59));
    const g = Math.round(130 + t * (253 - 130));
    const b = Math.round(246 - t * (246 - 71));
    return `rgb(${r},${g},${b})`;
  };

  return (
    <div className="latent-grid-wrapper">
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

                  return (
                    <div
                      key={idx}
                      className="latent-cell"
                      onClick={() => handleSelect(layer, idx)}
                      style={{
                        backgroundColor: activityToColor(displayVal, layerActivity),
                        border: isActive ? "3px solid black" : "1px solid #ccc",
                        transform: isActive ? "scale(1.2)" : "scale(1)",
                        boxShadow: isActive ? "0 0 8px rgba(0,0,0,0.5)" : "none",
                        transition: "all 0.15s ease-in-out",
                        cursor: "pointer",
                        color: isActive ? "#000" : "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      title={`Δlatent: ${deltaVal}`}
                    >
                      {idx + 1}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Slider */}
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
