import React, { useMemo, useState, useEffect } from "react";

const COLORS = ["#0b5cff", "#f97316", "#059669", "#b91c1c", "#7c3aed", "#0369a1", "#f43f5e", "#f59e0b"];

// Helper: format Date to YYYY-MM-DD
function formatDate(d) {
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

// start date per your note
const START_DATE = new Date(Date.UTC(2021, 3, 15)); // April 15, 2021 (month is 0-based)

function niceMax(arr) {
    const m = Math.max(...arr);
    const pow = Math.pow(10, Math.floor(Math.log10(m || 1)));
    return Math.ceil(m / pow) * pow;
}

function mean(arr = []) {
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return arr.reduce((a, b) => a + Number(b), 0) / arr.length;
}

export default function RMSEChart({ sitesRmse = {}, selectedSites = [], horizon = 0, focusedSiteProp = null }) {
    const [selectedDay, setSelectedDay] = useState(1);
    const [focusedSite, setFocusedSite] = useState(focusedSiteProp || (selectedSites.length === 1 ? selectedSites[0] : null));
    const [detailed, setDetailed] = useState({ loading: false, error: null, pred: null, target: null });

    // keep focused prop sync
    useEffect(() => {
        if (focusedSiteProp) setFocusedSite(focusedSiteProp);
    }, [focusedSiteProp]);

    // auto-focus when only one site selected
    useEffect(() => {
        if (!focusedSite && selectedSites.length === 1) setFocusedSite(selectedSites[0]);
    }, [selectedSites, focusedSite]);

    // build deterministic color map from selectedSites order
    const colorMap = useMemo(() => {
        const map = {};
        selectedSites.forEach((s, i) => {
            map[String(s)] = COLORS[i % COLORS.length];
        });
        return map;
    }, [selectedSites]);

    // prepare series for compact RMSE plot using colorMap
    const series = useMemo(() => {
        return selectedSites
            .filter(s => sitesRmse && sitesRmse[s] && Array.isArray(sitesRmse[s]))
            .map((s) => ({ site: s, values: sitesRmse[s].slice(0, horizon), color: colorMap[String(s)] || COLORS[0] }));
    }, [sitesRmse, selectedSites, horizon, colorMap]);

    const allValues = series.flatMap(s => s.values);
    const yMax = allValues.length ? Math.max(...allValues) : 1;
    const yTop = niceMax([yMax]);

    // what color should the detailed plot use for the focused site?
    const focusedColor = focusedSite ? (colorMap[String(focusedSite)] || COLORS[0]) : COLORS[0];

    // Fetch detailed predictions/target for focusedSite & selectedDay
    useEffect(() => {
        async function fetchDetail() {
            if (!focusedSite) {
                setDetailed({ loading: false, error: null, pred: null, target: null });
                return;
            }
            setDetailed({ loading: true, error: null, pred: null, target: null });
            try {
                const res = await fetch(`http://localhost:5000/api/site_forecast?site=${encodeURIComponent(focusedSite)}&lead=${selectedDay}`);
                const data = await res.json();
                if (!res.ok) {
                    setDetailed({ loading: false, error: data.error || "Error loading site forecast", pred: null, target: null });
                } else {
                    setDetailed({ loading: false, error: null, pred: data.pred || null, target: data.target || null, horizon: data.horizon || 0 });
                }
            } catch (err) {
                setDetailed({ loading: false, error: String(err), pred: null, target: null });
            }
        }
        fetchDetail();
    }, [focusedSite, selectedDay]);

    // compact chart geometry (wider / taller)
    const leftWidth = 760;
    const leftHeight = 300;
    const pad = { l: 56, r: 16, t: 16, b: 48 };
    const innerW = leftWidth - pad.l - pad.r;
    const innerH = leftHeight - pad.t - pad.b;

    const xScale = (i) => {
        if (!horizon || horizon <= 1) return pad.l;
        return pad.l + (i / (horizon - 1)) * innerW;
    };
    const yScale = (v) => pad.t + innerH - (v / (yTop || 1)) * innerH;

    // For detailed plot x-axis: use START_DATE + shift (selectedDay - 1) + index
    const computeDateForIndex = (i) => {
        const dt = new Date(START_DATE);
        dt.setUTCDate(dt.getUTCDate() + (selectedDay - 1) + i);
        return dt;
    };

    // choose tick frequency for date labels (max ~10 labels)
    const labelInterval = (n) => {
        if (n <= 10) return 1;
        return Math.ceil(n / 10);
    };

    // Determine RMSE value to display for the focused site/day.
    const focusedRmseDay = (() => {
        try {
            const key = String(focusedSite);
            if (key && sitesRmse && Array.isArray(sitesRmse[key]) && sitesRmse[key].length >= selectedDay) {
                return Number(sitesRmse[key][selectedDay - 1]);
            }
            // fallback: compute from detailed arrays if available
            if (detailed.pred && detailed.target) {
                const p = detailed.pred.map(Number);
                const t = detailed.target.map(Number);
                const n = Math.min(p.length, t.length);
                if (n === 0) return null;
                const mse = p.slice(0, n).reduce((acc, val, i) => acc + (val - t[i]) ** 2, 0) / n;
                return Math.sqrt(mse);
            }
            return null;
        } catch (e) {
            return null;
        }
    })();

    // Average RMSE across lead days (compact precomputed)
    const focusedAvgRmse = (() => {
        try {
            const key = String(focusedSite);
            if (key && sitesRmse && Array.isArray(sitesRmse[key]) && sitesRmse[key].length > 0) {
                return mean(sitesRmse[key]);
            }
            return null;
        } catch (e) {
            return null;
        }
    })();

    return (
        <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
            {/* Left: compact RMSE per lead-day */}
            <div style={{ flex: "0 0 780px" }}>
                <h4 style={{ margin: "0 0 8px 0" }}>Avg RMSE per Lead Day</h4>
                <div style={{ border: "1px solid #e5e7eb", padding: 8, borderRadius: 6 }}>
                    <svg width="100%" viewBox={`0 0 ${leftWidth} ${leftHeight}`} style={{ width: "100%", height: "auto" }}>
                        {/* axes */}
                        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t + innerH} stroke="#ddd" />
                        <line x1={pad.l} y1={pad.t + innerH} x2={pad.l + innerW} y2={pad.t + innerH} stroke="#ddd" />

                        {/* y ticks */}
                        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
                            const val = (yTop * t);
                            const y = yScale(val);
                            return (
                                <g key={i}>
                                    <line x1={pad.l - 6} x2={pad.l} y1={y} y2={y} stroke="#eee" />
                                    <text x={pad.l - 12} y={y + 4} fontSize="11" textAnchor="end" fill="#666">{val.toFixed(2)}</text>
                                </g>
                            );
                        })}

                        {/* lines */}
                        {series.map((s) => {
                            const path = s.values.map((v, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(v)}`).join(" ");
                            return (
                                <g key={s.site}>
                                    <path d={path} fill="none" stroke={s.color} strokeWidth={2} strokeOpacity={0.95} />
                                    {s.values.map((v, i) => (
                                        <circle key={i} cx={xScale(i)} cy={yScale(v)} r={3} fill={s.color} />
                                    ))}
                                </g>
                            );
                        })}

                        {/* vertical line for selectedDay */}
                        {selectedDay && horizon > 0 && (
                            <line
                                x1={xScale(selectedDay - 1)}
                                x2={xScale(selectedDay - 1)}
                                y1={pad.t}
                                y2={pad.t + innerH}
                                stroke="#111827"
                                strokeOpacity={0.12}
                            />
                        )}

                        {/* x axis labels: lead days */}
                        {Array.from({ length: Math.max(1, horizon) }).map((_, i) => (
                            <text key={i} x={xScale(i)} y={pad.t + innerH + 22} fontSize="11" textAnchor="middle" fill="#333">
                                {i + 1}
                            </text>
                        ))}

                        {/* x-axis label */}
                        <text x={pad.l + innerW / 2} y={leftHeight - 8} fontSize="13" textAnchor="middle" fill="#333">
                            Lead day (1..{horizon || "H"})
                        </text>

                        {/* y-axis label */}
                        <text x={14} y={pad.t + innerH / 2} fontSize="13" textAnchor="middle" transform={`rotate(-90 14 ${pad.t + innerH / 2})`} fill="#333">
                            RMSE
                        </text>
                    </svg>

                    {/* legend with colored labels */}
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 10 }}>
                        {series.map((s) => (
                            <div key={s.site} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 12, height: 12, background: s.color, borderRadius: 3 }} />
                                <div style={{ fontSize: 13, color: s.color }}>{s.site}</div>
                            </div>
                        ))}
                    </div>

                    {/* day selector */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
                        <label style={{ fontSize: 13 }}>Lead day:</label>
                        <input
                            type="range"
                            min={1}
                            max={Math.max(1, horizon)}
                            value={selectedDay}
                            onChange={(e) => setSelectedDay(Number(e.target.value))}
                            style={{ flex: 1 }}
                        />
                        <div style={{ width: 44, textAlign: "right", fontSize: 13 }}>{selectedDay}</div>
                    </div>
                </div>
            </div>

            {/* Right: larger detailed forecast/time-series for focused site */}
            <div style={{ flex: "1 1 840px", minWidth: 840 }}>
                <h4 style={{ margin: "0 0 8px 0" }}>Detailed Forecast (focused site)</h4>
                <div style={{ border: "1px solid #e5e7eb", padding: 12, borderRadius: 6 }}>
                    {/* Top row: focus buttons (left) + RMSE metrics box (right) */}
                    <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                            <div style={{ fontSize: 13, color: "#666", marginRight: 8 }}>Focus site:</div>
                            {selectedSites.length === 0 ? (
                                <div style={{ color: "#666", fontSize: 13 }}>No sites selected.</div>
                            ) : (
                                selectedSites.map((s, idx) => {
                                    const color = colorMap[String(s)] || COLORS[idx % COLORS.length];
                                    const isFocused = String(focusedSite) === String(s);
                                    return (
                                        <button
                                            key={s}
                                            onClick={() => setFocusedSite(s)}
                                            style={{
                                                padding: "6px 10px",
                                                background: isFocused ? color : "#fff",
                                                color: isFocused ? "#fff" : color,
                                                border: `1px solid ${color}`,
                                                borderRadius: 6,
                                                cursor: "pointer",
                                            }}
                                        >
                                            {s}
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        {/* RMSE metrics box */}
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                            {focusedSite ? (
                                <div style={{ display: "flex", gap: 8, alignItems: "center", background: "#fff", padding: "6px 10px", borderRadius: 8, border: "1px solid #eee" }}>
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                                        <div style={{ fontSize: 12, color: "#666" }}>Avg RMSE</div>
                                        <div style={{ fontSize: 16, fontWeight: 700, color: focusedColor }}>{focusedAvgRmse == null ? "N/A" : Number(focusedAvgRmse).toFixed(3)}</div>
                                    </div>
                                    <div style={{ width: 1, height: 36, background: "#eee" }} />
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                                        <div style={{ fontSize: 12, color: "#666" }}>RMSE (lead {selectedDay})</div>
                                        <div style={{ fontSize: 16, fontWeight: 700, color: focusedColor }}>{focusedRmseDay == null ? "N/A" : Number(focusedRmseDay).toFixed(3)}</div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ fontSize: 13, color: "#666" }}>Select a focused site to see RMSE</div>
                            )}
                        </div>
                    </div>

                    {!focusedSite ? (
                        <div style={{ color: "#666" }}>No focused site. Shift+click a site in the list to focus it for details or use the buttons above.</div>
                    ) : detailed.loading ? (
                        <div>Loading detailed forecast for site {focusedSite} (lead {selectedDay})...</div>
                    ) : detailed.error ? (
                        <div style={{ color: "red" }}>{detailed.error}</div>
                    ) : detailed.pred && detailed.target ? (
                        <div>
                            <div style={{ fontSize: 13, marginBottom: 8 }}>
                                Site <strong>{focusedSite}</strong> — Lead day <strong>{selectedDay}</strong>
                            </div>

                            {/* bigger SVG time-series with axis labels and legend */}
                            <div style={{ width: "100%", height: 420 }}>
                                <svg width="100%" viewBox="0 0 920 420" style={{ width: "100%", height: "auto" }}>
                                    {(() => {
                                        const pred = detailed.pred.map(Number);
                                        const targ = detailed.target.map(Number);
                                        const n = Math.max(pred.length, targ.length);
                                        const left = 84;
                                        const right = 36;
                                        const top = 24;
                                        const bottom = 86;
                                        const W = 920;
                                        const H = 420;
                                        const innerW = W - left - right;
                                        const innerH = H - top - bottom;

                                        // compute y domain
                                        const all = [...pred, ...targ];
                                        const yMin = Math.min(...all);
                                        const yMax = Math.max(...all);
                                        const yPad = (yMax - yMin) * 0.06 || 1;
                                        const ymin = yMin - yPad;
                                        const ymax = yMax + yPad;
                                        const yScale = (v) => top + innerH - ((v - ymin) / (ymax - ymin)) * innerH;
                                        const xScale = (i) => left + (innerW * (i / Math.max(1, n - 1)));

                                        // axes
                                        const yTicks = 5;
                                        const yTickVals = Array.from({ length: yTicks }).map((_, i) => ymin + (i / (yTicks - 1)) * (ymax - ymin));

                                        return (
                                            <g>
                                                {/* axes lines */}
                                                <line x1={left} y1={top} x2={left} y2={top + innerH} stroke="#ddd" />
                                                <line x1={left} y1={top + innerH} x2={left + innerW} y2={top + innerH} stroke="#ddd" />

                                                {/* y ticks and labels */}
                                                {yTickVals.map((val, i) => {
                                                    const y = yScale(val);
                                                    return (
                                                        <g key={i}>
                                                            <line x1={left - 8} x2={left} y1={y} y2={y} stroke="#eee" />
                                                            <text x={left - 14} y={y + 4} fontSize="12" textAnchor="end" fill="#333">{val.toFixed(2)}</text>
                                                        </g>
                                                    );
                                                })}

                                                {/* x ticks labels: compute date labels with offset (lead-1) */}
                                                {Array.from({ length: n }).map((_, i) => {
                                                    const date = computeDateForIndex(i);
                                                    // only label every interval to avoid crowding
                                                    const interval = labelInterval(n);
                                                    if (i % interval !== 0 && i !== n - 1) return null;
                                                    const x = xScale(i);
                                                    return (
                                                        <g key={i}>
                                                            <line x1={x} x2={x} y1={top + innerH} y2={top + innerH + 6} stroke="#eee" />
                                                            <text x={x} y={top + innerH + 22} fontSize="11" textAnchor="middle" fill="#333">{formatDate(date)}</text>
                                                        </g>
                                                    );
                                                })}

                                                {/* prediction line (with markers in focused color) */}
                                                <path
                                                    d={pred.map((v, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(v)}`).join(" ")}
                                                    fill="none"
                                                    stroke={focusedColor}
                                                    strokeWidth={2}
                                                />

                                                {/* target as points only */}
                                                {targ.map((v, i) => <circle key={`t-${i}`} cx={xScale(i)} cy={yScale(v)} r={4} fill="#111" />)}

                                                {/* prediction small circles */}
                                                {pred.map((v, i) => <circle key={`p-${i}`} cx={xScale(i)} cy={yScale(v)} r={2.6} fill={focusedColor} />)}

                                                {/* axis labels */}
                                                <text x={left + innerW / 2} y={H - 28} fontSize="13" textAnchor="middle" fill="#111">Date</text>
                                                <text x={18} y={top + innerH / 2} fontSize="13" textAnchor="middle" transform={`rotate(-90 18 ${top + innerH / 2})`} fill="#111">Stream temperature (°C)</text>

                                                {/* legend (top-right) */}
                                                <g transform={`translate(${left + innerW - 220}, ${top})`}>
                                                    <rect x={0} y={0} width={200} height={62} rx={6} fill="#fff" stroke="#eee" />
                                                    <g transform="translate(10,10)">
                                                        <rect x={0} y={0} width={14} height={8} fill={focusedColor} />
                                                        <text x={22} y={8} fontSize="12" fill="#111">Prediction (line)</text>
                                                    </g>
                                                    <g transform="translate(10,32)">
                                                        <circle cx={7} cy={6} r={5} fill="#111" />
                                                        <text x={22} y={10} fontSize="12" fill="#111">Target (points)</text>
                                                    </g>
                                                </g>
                                            </g>
                                        );
                                    })()}
                                </svg>
                            </div>

                            {/* numeric summary moved to top, so no need at bottom */}
                        </div>
                    ) : (
                        <div style={{ color: "#666" }}>No detailed data available.</div>
                    )}
                </div>
            </div>
        </div>
    );
}