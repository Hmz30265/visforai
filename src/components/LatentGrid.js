import React, { useState } from "react";

function MiniDistribution({ means }) {
  const width = 40;
  const height = 20;
  const numBins = 20;

  if (!means || means.length === 0) {
    return <svg width={width} height={height}></svg>;
  }

  const minVal = Math.min(...means);
  const maxVal = Math.max(...means);
  let range = maxVal - minVal;

  if (range <= 1e-9) {
    range = 1e-6;
  }

  const binWidth = range / numBins;
  const bins = new Array(numBins).fill(0);

  means.forEach(v => {
    const idx = Math.min(Math.floor((v - minVal) / binWidth), numBins - 1);
    bins[idx]++;
  });

  const maxCount = Math.max(...bins);

  return (
    <svg width={width} height={height}>
      {bins.map((count, i) => {
        const barHeight = (count / maxCount) * height;
        const barWidth = width / numBins;
        const x = i * barWidth;
        const y = height - barHeight;

        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barWidth - 0.5}
            height={barHeight}
            fill="rgba(59,130,246,0.7)"
          />
        );
      })}
    </svg>
  );
}

export function LatentDistributionDetail({ selectedDim, latentInfo }) {
  const layerNames = ["Daily", "Weekly", "Biweekly"];
  
  if (selectedDim.dim === null || selectedDim.layer === null) {
    return (
      <div style={{ 
        marginBottom: '2rem',
        padding: '2rem',
        textAlign: 'center',
        color: '#999',
        border: '2px dashed #ddd',
        borderRadius: '8px',
        backgroundColor: '#f9fafb'
      }}>
        <p style={{ margin: 0, fontSize: '16px' }}>
          Select a latent dimension to view its detailed distribution
        </p>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '14px' }}>
          Click any cell in the Latent Activity grid below
        </p>
      </div>
    );
  }

  const data = latentInfo[selectedDim.layer];
  if (!data?.allMeans?.[selectedDim.dim]) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        Distribution data not available
      </div>
    );
  }

  const means = data.allMeans[selectedDim.dim];
  const mean = data.mean[selectedDim.dim];
  const std = data.std[selectedDim.dim];
  
  const numBins = 30;
  const minVal = Math.min(...means);
  const maxVal = Math.max(...means);
  const range = maxVal - minVal;
  const binWidth = range / numBins;
  
  const bins = new Array(numBins).fill(0);
  means.forEach(val => {
    const binIdx = Math.min(Math.floor((val - minVal) / binWidth), numBins - 1);
    bins[binIdx]++;
  });
  
  const maxBinCount = Math.max(...bins);
  const histHeight = 200;
  const histWidth = 500;
  
  return (
    <div style={{
      marginBottom: '2rem',
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '20px' }}>
          Distribution: Latent Dim {selectedDim.dim + 1}, {layerNames[selectedDim.layer]} Layer
        </h3>
        <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '14px' }}>
          Distribution of mean values across all sites, lead days, and forecast steps
        </p>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '1rem', 
        marginBottom: '1.5rem',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Mean (μ)</div>
          <div style={{ fontSize: '18px', fontWeight: 600 }}>{mean.toFixed(3)}</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Std Dev (σ)</div>
          <div style={{ fontSize: '18px', fontWeight: 600 }}>{std.toFixed(3)}</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Min / Max</div>
          <div style={{ fontSize: '18px', fontWeight: 600 }}>{minVal.toFixed(2)} / {maxVal.toFixed(2)}</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Sample Count</div>
          <div style={{ fontSize: '18px', fontWeight: 600 }}>{means.length.toLocaleString()}</div>
        </div>
      </div>
      
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
        <svg width={histWidth} height={histHeight + 40}>
          {bins.map((count, i) => {
            const barHeight = (count / maxBinCount) * histHeight;
            const x = (i / numBins) * histWidth;
            const barWidth = histWidth / numBins;
            
            return (
              <rect
                key={i}
                x={x}
                y={histHeight - barHeight}
                width={barWidth - 1}
                height={barHeight}
                fill="#3b82f6"
                opacity={0.7}
              />
            );
          })}
          
          <line
            x1={0}
            y1={histHeight}
            x2={histWidth}
            y2={histHeight}
            stroke="#333"
            strokeWidth={2}
          />
          
          <text x={0} y={histHeight + 20} fontSize={12} fill="#666">
            {minVal.toFixed(2)}
          </text>
          <text x={histWidth / 2} y={histHeight + 20} fontSize={12} fill="#666" textAnchor="middle">
            {((minVal + maxVal) / 2).toFixed(2)}
          </text>
          <text x={histWidth} y={histHeight + 20} fontSize={12} fill="#666" textAnchor="end">
            {maxVal.toFixed(2)}
          </text>
          
          <line
            x1={(mean - minVal) / range * histWidth}
            y1={0}
            x2={(mean - minVal) / range * histWidth}
            y2={histHeight}
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="5,5"
          />
          <text
            x={(mean - minVal) / range * histWidth}
            y={-5}
            fontSize={12}
            fill="#ef4444"
            textAnchor="middle"
            fontWeight={600}
          >
            μ
          </text>
        </svg>
      </div>
      
      <div style={{
        padding: '1rem',
        backgroundColor: '#eff6ff',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#1e40af',
        lineHeight: 1.6
      }}>
        <strong>Interpretation:</strong> This histogram shows where mean values typically fall for this latent dimension. 
        Wider spread (higher variance) indicates this dimension encodes different information across contexts. 
        When adjusting the sampling offset below, you're choosing where along this distribution to deterministically sample from.
      </div>
    </div>
  );
}

export default function LatentGrid({ 
  activityData = [], 
  latentInfo = [], 
  onSelectDimension,
  focusedSite,
  onInference,
  isInferenceRunning = false
}) {
    const [selected, setSelected] = useState({ layer: null, dim: null });
    const [topK, setTopK] = useState(6);
    const [latentOffset, setLatentOffset] = useState(0);
    const layerNames = ["Daily", "Weekly", "Biweekly"];

    const handleSelect = (layer, dim) => {
        if (selected.layer === layer && selected.dim === dim) {
            setSelected({ layer: null, dim: null });
            setLatentOffset(0);
            if (onSelectDimension) {
              onSelectDimension({ layer: null, dim: null });
            }
        } else {
            setSelected({ layer, dim });
            setLatentOffset(0);
            if (onSelectDimension) {
              onSelectDimension({ layer, dim });
            }
        }
    };

    const handleInferenceClick = () => {
        if (onInference) {
            onInference(selected.layer, selected.dim, latentOffset);
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

    const activityColorAndText = (val, layerActivity) => {
        if (!layerActivity || layerActivity.length === 0) {
            return { bg: "#3b82f6", text: "#fff" };
        }
        const minVal = Math.min(...layerActivity);
        const maxVal = Math.max(...layerActivity);
        const t = (val - minVal) / (maxVal - minVal || 1);

        const r = Math.round(59 + t * (253 - 59));
        const g = Math.round(130 + t * (253 - 130));
        const b = Math.round(246 - t * (246 - 71));
        const bg = `rgb(${r},${g},${b})`;

        const srgb = [r / 255, g / 255, b / 255].map((c) =>
            c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
        );
        const luminance = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
        const text = luminance > 0.5 ? "#000" : "#fff";

        return { bg, text };
    };

    const canRunInference = selected.layer !== null && focusedSite !== null && focusedSite !== undefined;

    return (
        <div className="latent-grid-wrapper">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div>
                    <h3 style={{ margin: 0 }}>Latent Space Activity</h3>
                    <div style={{ fontSize: 16, color: "#555" }}>
                      Variance of means per latent dimension (higher = more variability)
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontSize: 16, color: "#555", marginRight: 6 }}>Variability:</div>
                    <div style={{ width: 140, height: 12, borderRadius: 6, background: "linear-gradient(90deg, #3b82f6 0%, #facc15 100%)" }} />
                    <div style={{ fontSize: 16, color: "#333", marginLeft: 6 }}>
                        <span style={{ color: "#3b82f6" }}>Low</span> — <span style={{ color: "#facc15" }}>High</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
                {layerNames.map((name, layer) => {
                    const layerActivity = activityData[layer] || [];
                    const topDims = getTopIndices(layerActivity, topK);

                    return (
                        <div key={layer} style={{ flex: 1 }}>
                            <h4 style={{ textAlign: 'center', fontSize: '16px', marginBottom: '0.5rem' }}>{name}</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {topDims.map(({ idx, val }) => {
                                    const isActive = selected.layer === layer && selected.dim === idx;
                                    const { bg, text } = activityColorAndText(val, layerActivity);

                                    return (
                                        <div
                                            key={idx}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                        >
                                            <div
                                                onClick={() => handleSelect(layer, idx)}
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
                                                title={`Variance: ${val.toFixed(3)}`}
                                            >
                                                <span style={{ color: text, WebkitTextFillColor: text }}>
                                                    {idx + 1}
                                                </span>
                                            </div>
                                            <MiniDistribution means={latentInfo[layer]?.allMeans[idx]} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
                <div style={{ fontSize: 13, color: "#333" }}>Hierarchical layers (left → right)</div>
            </div>

            {selected.layer !== null && latentInfo[selected.layer]?.std ? (
                <div style={{ marginTop: "1rem", padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '16px' }}>
                        Latent Sampling Experiment
                    </h4>
                    <p style={{ margin: '0 0 1rem 0', fontSize: '13px', color: '#666' }}>
                        Adjust the sampling offset to explore how this latent dimension affects predictions
                    </p>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ minWidth: '150px' }}>Offset (-3σ → +3σ):</span>
                        <input
                            type="range"
                            min={-3}
                            max={3}
                            step={0.5}
                            value={latentOffset}
                            onChange={(e) => {
                                const snapped = Math.round(Number(e.target.value) / 0.5) * 0.5;
                                setLatentOffset(snapped);
                            }}
                            style={{ flex: 1 }}
                        />
                        <span style={{ 
                          minWidth: '80px', 
                          fontFamily: 'monospace',
                          fontSize: '14px',
                          fontWeight: 600 
                        }}>
                            {latentOffset.toFixed(1)}σ
                        </span>
                    </label>
                    <div style={{ marginTop: '0.5rem', fontSize: '12px', color: '#666' }}>
                        Actual offset: {(latentOffset * (latentInfo[selected.layer]?.std?.[selected.dim] ?? 0)).toFixed(3)}
                    </div>
                </div>
            ) : null}

            <div style={{ marginTop: "1rem", display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Show top
                    <input
                        type="number"
                        min="1"
                        max="24"
                        value={topK}
                        onChange={handleTopKChange}
                        style={{ width: "50px" }}
                    />
                    latents
                </label>
                <button
                    onClick={handleInferenceClick}
                    disabled={!canRunInference || isInferenceRunning}
                    style={{
                      padding: '0.5rem 1rem',
                      opacity: !canRunInference || isInferenceRunning ? 0.5 : 1,
                      cursor: !canRunInference || isInferenceRunning ? 'not-allowed' : 'pointer',
                      backgroundColor: isInferenceRunning ? '#cbd5e1' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontWeight: 500
                    }}
                >
                    {isInferenceRunning ? 'Running...' : 'Run Inference'}
                </button>
                {focusedSite !== null && focusedSite !== undefined && (
                    <span style={{ fontSize: '13px', color: '#666' }}>
                        Site: {focusedSite}
                    </span>
                )}
                {!canRunInference && (
                    <span style={{ fontSize: '13px', color: '#ef4444' }}>
                        {focusedSite === null ? 'Select a site first' : 'Select a latent dimension'}
                    </span>
                )}
            </div>
        </div>
    );
}