import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { scaleQuantile } from "d3-scale";
import { Tooltip } from "react-tooltip";
import { useState, useEffect } from "react";
import axios from "../api/axios";

const GEO_URL = "https://raw.githubusercontent.com/varunon9/india-choropleth-javascript/master/src/india.topo.json";

function normalizeState(name) {
  return name?.toLowerCase().trim().replace(/\s+/g, " ");
}

export default function IndiaMap() {
  const [stateData, setStateData] = useState([]);
  const [tooltipContent, setTooltipContent] = useState("");
  const [tooltipId] = useState("india-map-tooltip");
  const [activeMetric, setActiveMetric] = useState("votes"); // votes | fraud | flagged

  useEffect(() => {
    axios.get("/admin/state-stats").then(res => setStateData(res.data));
  }, []);

  const metricConfig = {
    votes:   { label: "Total Votes",    colors: ["#162032", "#1E3A5F", "#FF6B00"], key: "votes" },
    fraud:   { label: "Fraud Attempts", colors: ["#162032", "#3D1A1A", "#C0392B"], key: "fraud" },
    flagged: { label: "Flagged Voters", colors: ["#162032", "#2D2000", "#D4AF37"], key: "flagged" },
  };

  const cfg = metricConfig[activeMetric];
  const values = stateData.map(s => s[cfg.key] || 0);
  
  const colorScale = scaleQuantile()
    .domain(values.length > 0 ? values : [0, 100])
    .range(cfg.colors);

  const getStateInfo = (geoName) => {
    return stateData.find(s => normalizeState(s.state) === normalizeState(geoName));
  };

  return (
    <div className="bg-ev-navy-800 rounded-[2rem] p-8 border border-white/5 relative overflow-hidden group">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-ev-gold/5 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 relative z-10">
        <div>
          <h3 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-ev-gold" />
            National Identity Heatmap
          </h3>
          <p className="text-[10px] font-mono text-ev-text-muted uppercase tracking-[0.2em] mt-1">Geospatial Integrity Distribution</p>
        </div>
        
        {/* Metric selector */}
        <div className="flex p-1 bg-ev-navy rounded-xl border border-white/5">
          {Object.entries(metricConfig).map(([key, val]) => (
            <button key={key}
              onClick={() => setActiveMetric(key)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
                ${activeMetric === key
                  ? "bg-white text-ev-navy shadow-lg"
                  : "text-ev-text-muted hover:text-white"}`}>
              {val.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div className="w-full relative bg-ev-navy/30 rounded-2xl border border-white/5 overflow-hidden" style={{ height: 520 }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 1100, center: [82.5, 22] }}
          style={{ width: "100%", height: "100%" }}
        >
          <ZoomableGroup zoom={1} maxZoom={2} center={[82.5, 22]}>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const stateName = geo.properties.ST_NM || geo.properties.name || "";
                  const info = getStateInfo(stateName);
                  const value = info?.[cfg.key] || 0;
                  const fillColor = value > 0 ? colorScale(value) : "#162032";

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fillColor}
                      stroke="#243044"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none", transition: "all 0.4s ease" },
                        hover: {
                          fill: "#FF6B00",
                          stroke: "#FFF",
                          strokeWidth: 1.5,
                          outline: "none",
                          cursor: "pointer",
                          filter: "drop-shadow(0 0 10px rgba(255,107,0,0.5))"
                        },
                        pressed: { outline: "none" }
                      }}
                      onMouseEnter={() => {
                        setTooltipContent(`
                          <div class="p-3 font-sans min-w-[150px]">
                            <p class="text-[10px] font-black text-ev-gold uppercase tracking-widest mb-2 border-b border-white/10 pb-1">${stateName}</p>
                            <div class="space-y-1">
                               <div class="flex justify-between text-[10px]">
                                  <span class="text-ev-text-muted">TOTAL_VOTES:</span>
                                  <span class="text-white font-mono">${info?.votes || 0}</span>
                               </div>
                               <div class="flex justify-between text-[10px]">
                                  <span class="text-ev-text-muted">FRAUD_NODES:</span>
                                  <span class="text-ev-red font-mono">${info?.fraud || 0}</span>
                               </div>
                               <div class="flex justify-between text-[10px]">
                                  <span class="text-ev-text-muted">BLOCKED_IDS:</span>
                                  <span class="text-ev-saffron font-mono">${info?.flagged || 0}</span>
                               </div>
                            </div>
                          </div>
                        `);
                      }}
                      onMouseLeave={() => setTooltipContent("")}
                      data-tooltip-id={tooltipId}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      <Tooltip id={tooltipId}
        className="!bg-ev-navy-800 !border !border-white/10 !p-0 !rounded-xl !opacity-100 shadow-2xl"
      >
        <div dangerouslySetInnerHTML={{ __html: tooltipContent }} />
      </Tooltip>

      {/* Legend & Stats Overlay */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6 px-2 relative z-10">
        <div className="flex items-center gap-6">
           <div className="flex flex-col">
              <span className="text-[9px] font-mono text-ev-text-muted uppercase mb-1">Scale Density</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-white">LOW</span>
                <div className="h-1.5 w-48 rounded-full" style={{
                  background: `linear-gradient(to right, ${cfg.colors.join(",")})`
                }} />
                <span className="text-[10px] font-black text-white">HIGH</span>
              </div>
           </div>
        </div>
        
        <div className="flex gap-10">
           <div className="text-right">
              <p className="text-[9px] font-mono text-ev-text-muted uppercase">Active Pulse</p>
              <p className="text-xl font-black text-white">STABLE_NET</p>
           </div>
           <div className="text-right">
              <p className="text-[9px] font-mono text-ev-text-muted uppercase">Refresh Rate</p>
              <p className="text-xl font-black text-ev-gold">0.320ms</p>
           </div>
        </div>
      </div>
    </div>
  );
}
