import React, { useState, useEffect } from 'react';
import { 
  ComposableMap, 
  Geographies, 
  Geography, 
} from "react-simple-maps";
import { scaleSequential } from "d3-scale";
import { interpolateRgb } from "d3-interpolate";
import axios from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';

// India States TopoJSON
const INDIA_TOPO_JSON = "https://raw.githubusercontent.com/datta07/INDIAN-SHAPEFILES/master/INDIA/INDIA_STATES.json";

export default function IndiaHeatmap() {
  const [data, setData] = useState([]);
  const [tooltip, setTooltip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/fraud/state-stats');
        setData(response.data.stats);
        setLoading(false);
      } catch (err) {
        console.error("Map data error:", err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const maxVotes = Math.max(...data.map(d => d.votes), 10);
  
  const colorScale = scaleSequential()
    .domain([0, maxVotes])
    .interpolator(interpolateRgb("#162032", "#FF6B00")); // Deep Navy to Saffron

  const getStatsForState = (stateName) => {
    return data.find(d => d.state.toLowerCase() === stateName.toLowerCase()) || 
           { votes: 0, flagged: 0, fraud: 0 };
  };

  if (loading) return <div className="h-96 flex items-center justify-center text-ev-text-secondary">Analyzing Regional Densities...</div>;

  return (
    <div className="relative ev-card p-6 h-full overflow-hidden">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">Regional Voter Density</h3>
          <p className="text-ev-text-secondary text-xs">O(V) spatial distribution of electoral activity</p>
        </div>
        <div className="flex items-center gap-4 text-[10px] uppercase font-bold tracking-widest">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-ev-navy-800 border border-ev-surface-border"></div> Low</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-ev-saffron"></div> High</div>
        </div>
      </div>

      <div className="h-[400px] flex items-center justify-center">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 800,
            center: [82, 22] // Centered over India
          }}
          className="w-full h-full"
        >
          <Geographies geography={INDIA_TOPO_JSON}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const stateName = geo.properties.ST_NM;
                const stats = getStatsForState(stateName);
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => setTooltip({ name: stateName, ...stats })}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      default: {
                        fill: colorScale(stats.votes),
                        stroke: "#243044",
                        strokeWidth: 0.5,
                        outline: "none",
                      },
                      hover: {
                        fill: "#00A86B", // Green highlight on hover
                        stroke: "#D4AF37",
                        strokeWidth: 1,
                        outline: "none",
                        cursor: "pointer"
                      },
                      pressed: {
                        fill: "#FF6B00",
                        outline: "none",
                      }
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>

        {/* Dynamic Tooltip */}
        <AnimatePresence>
          {tooltip && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-10 right-10 ev-card seal-border p-4 pointer-events-none z-50 min-w-[180px]"
            >
              <h4 className="text-ev-gold font-bold text-sm mb-2 border-b border-ev-gold/20 pb-1">{tooltip.name}</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-ev-text-secondary">TOTAL VOTES:</span>
                  <span className="text-white font-mono">{tooltip.votes}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-ev-text-secondary">FLAGGED:</span>
                  <span className="text-ev-red font-mono">{tooltip.flagged}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-ev-text-secondary">FRAUD LOGS:</span>
                  <span className="text-ev-saffron font-mono">{tooltip.fraud}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
