import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import axios from "../api/axios";
import VoterIDCard from "../components/VoterIDCard";
import { AlertCircle, CheckCircle, ShieldAlert, Loader2, Search } from "lucide-react";

export default function IDScannerPage() {
  const [voters, setVoters] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [scannedResults, setScannedResults] = useState([]);
  const [stats, setStats] = useState({ clear: 0, suspicious: 0, fraud: 0 });
  const [selectedVoter, setSelectedVoter] = useState(null);
  const [scanComplete, setScanComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const scanLineRef = useRef(null);

  // Fetch all voters with fraud signals from backend
  useEffect(() => {
    fetchVoters();
  }, []);

  const fetchVoters = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/admin/voter-id-scan");
      setVoters(res.data.voters);
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const startScan = () => {
    if (scanning) return;
    setScanning(true);
    setScanComplete(false);
    setScannedResults([]);
    setCurrentIndex(0);
    setStats({ clear: 0, suspicious: 0, fraud: 0 });
  };

  useEffect(() => {
    if (!scanning || currentIndex < 0 || currentIndex >= voters.length) {
      if (scanning && currentIndex >= voters.length) {
        setScanning(false);
        setScanComplete(true);
      }
      return;
    }

    // Animate scan laser for current ID
    if (scanLineRef.current) {
      const tl = gsap.timeline({
        onComplete: () => {
          const voter = voters[currentIndex];
          setScannedResults(prev => [voter, ...prev]);
          setStats(prev => ({
            ...prev,
            clear: prev.clear + (voter.riskLevel === "CLEAR" ? 1 : 0),
            suspicious: prev.suspicious + (voter.riskLevel === "SUSPICIOUS" ? 1 : 0),
            fraud: prev.fraud + (voter.riskLevel === "FRAUD" ? 1 : 0),
          }));
          
          // Small delay before next scan
          setTimeout(() => setCurrentIndex(i => i + 1), 600);
        }
      });

      tl.fromTo(scanLineRef.current,
        { top: "0%", opacity: 0 },
        { top: "0%", opacity: 1, duration: 0.2 }
      ).to(scanLineRef.current,
        { top: "100%", duration: 1.2, ease: "power1.inOut" }
      ).to(scanLineRef.current,
        { opacity: 0, duration: 0.2 }
      );
    }
  }, [currentIndex, scanning]);

  const currentVoter = voters[currentIndex];

  if (loading) {
    return (
      <div className="min-h-screen bg-ev-navy flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-ev-gold animate-spin" />
          <p className="text-ev-gold font-mono text-sm tracking-widest">INITIALIZING SECURE SCANNER...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ev-navy p-6 pt-24 font-sans selection:bg-ev-gold/30">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div className="relative group">
            <div className="absolute -left-6 top-0 bottom-0 w-1 bg-ev-gold rounded-full group-hover:h-full transition-all duration-500 h-2/3" />
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-ev-gold" />
              Biometric ID Verification
            </h1>
            <p className="text-ev-text-muted mt-2 font-mono text-xs uppercase tracking-widest bg-ev-gold/5 px-2 py-1 rounded inline-block">
              ECI Integrity Protocol V4.2 • Levenshtein Distance Alg: O(m×n)
            </p>
          </div>

          <button
            onClick={startScan}
            disabled={scanning || voters.length === 0}
            className={`relative group px-10 py-4 rounded-xl font-black text-xs uppercase tracking-[0.3em] transition-all overflow-hidden
              ${scanning 
                ? "bg-ev-navy-800 text-ev-text-muted cursor-not-allowed border border-ev-navy-700" 
                : "bg-white text-ev-navy hover:bg-ev-gold-400 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-ev-gold/40"
              }`}
          >
            <span className="relative z-10">
              {scanning ? `SCANNING BATCH [${currentIndex + 1}/${voters.length}]` : "Execute Full Audit Scan"}
            </span>
            {!scanning && (
              <div className="absolute inset-0 bg-gradient-to-r from-ev-gold via-white to-ev-gold -translate-x-full group-hover:translate-x-full transition-transform duration-1000 opacity-20" />
            )}
          </button>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Total ID Registry", value: voters.length, color: "text-white", icon: Search, bg: "bg-ev-navy-800" },
            { label: "Verified Clear", value: stats.clear, color: "text-ev-green", icon: CheckCircle, bg: "bg-ev-green/5" },
            { label: "Security Warnings", value: stats.suspicious, color: "text-ev-saffron", icon: AlertCircle, bg: "bg-ev-saffron/5" },
            { label: "FRAUD DETECTED", value: stats.fraud, color: "text-ev-red", icon: ShieldAlert, bg: "bg-ev-red/5" },
          ].map((s, idx) => (
            <div key={idx} className={`p-6 rounded-2xl border border-white/5 transition-all hover:border-white/10 ${s.bg} ${s.label.includes('FRAUD') && s.value > 0 ? "animate-pulse border-ev-red/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]" : ""}`}>
              <div className="flex justify-between items-start mb-4">
                <s.icon className={`w-6 h-6 ${s.color}`} />
                <span className="text-[10px] font-mono text-ev-text-muted opacity-50 uppercase tracking-widest">METRIC_STB_{idx}</span>
              </div>
              <div className={`text-4xl font-black ${s.color} tracking-tighter mb-1`}>{s.value}</div>
              <div className="text-[10px] font-bold text-ev-text-muted uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Active Scanner Terminal */}
          <div className="lg:col-span-7">
            <h2 className="text-[10px] font-black text-ev-text-muted mb-4 uppercase tracking-[0.4em] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-ev-gold animate-ping" />
              Real-time Processing Node
            </h2>
            
            <div className="relative rounded-3xl overflow-hidden bg-ev-navy-800 border-2 border-white/5 p-8 min-h-[440px] flex flex-col items-center justify-center group shadow-2xl">
              {currentVoter && scanning ? (
                <div className="w-full flex flex-col items-center">
                  <div className="relative w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(212,175,55,0.05)]">
                    {/* ID Card Simulation */}
                    <div className="p-8 bg-ev-navy rounded-2xl border border-ev-gold/20 relative">
                       {/* Scanner laser line */}
                      <div ref={scanLineRef} className="absolute left-0 right-0 z-10 pointer-events-none opacity-0"
                           style={{ height: "4px", background: "#FF6B00", boxShadow: "0 0 20px #FF6B00, 0 0 40px #FF6B00" }}>
                        <div className="absolute top-1 left-0 right-0 h-[60px] bg-gradient-to-b from-ev-saffron/20 to-transparent pointer-events-none" />
                      </div>

                      <div className="flex gap-6 items-start relative z-0">
                        <div className="w-32 h-40 rounded-xl bg-ev-navy-800 border border-ev-gold/30 flex-shrink-0 grayscale overflow-hidden">
                           {currentVoter.photoBase64 
                              ? <img src={currentVoter.photoBase64} alt="" className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>}
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="space-y-1">
                            <p className="text-[8px] font-mono text-ev-gold tracking-[0.3em] uppercase opacity-60">Identity verification</p>
                            <h3 className="text-2xl font-black text-white tracking-tight leading-none">{currentVoter.name}</h3>
                            <p className="text-sm font-mono text-ev-text-muted">{currentVoter.voterID}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-ev-text-muted">
                            <div>
                               <p className="uppercase opacity-40">State Node</p>
                               <p className="text-ev-gold">{currentVoter.state}</p>
                            </div>
                            <div>
                               <p className="uppercase opacity-40">Chain Status</p>
                               <p className="text-white">ENCRYPTED</p>
                            </div>
                          </div>
                          
                          {/* System Logic Output */}
                          <div className="pt-4 border-t border-white/5 space-y-2">
                             {[
                               { label: "Biometric Scan", status: "VERIFIED" },
                               { label: "Identity Hash", status: "SYNCED" },
                               { label: "Geo-Location", status: "STABLE" }
                             ].map((l, i) => (
                               <div key={i} className="flex justify-between items-center text-[9px] font-mono border-l-2 border-ev-gold/30 pl-2">
                                  <span className="text-ev-text-muted uppercase">{l.label}</span>
                                  <span className="text-ev-gold animate-pulse">{l.status}</span>
                               </div>
                             ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Stats */}
                  <div className="mt-10 w-full max-w-sm space-y-2">
                      <div className="flex justify-between items-end">
                         <span className="text-[10px] font-mono text-ev-text-muted">DATA_STREAM_POINTER : {currentIndex + 1} / {voters.length}</span>
                         <span className="text-sm font-black text-white">{Math.round(((currentIndex + 1) / voters.length) * 100)}%</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                         <motion.div 
                            className="h-full bg-ev-gold"
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentIndex + 1) / voters.length) * 100}%` }}
                          />
                      </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6 text-center">
                  <div className="w-24 h-24 rounded-full border-2 border-white/5 flex items-center justify-center bg-white/5 transition-transform group-hover:scale-110 duration-500">
                    <Search className={`w-10 h-10 ${scanComplete ? "text-ev-green" : "text-ev-gold"}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {scanComplete ? "AUDIT CYCLE COMPLETE" : "SYSTEM READY FOR SCAN"}
                    </h3>
                    <p className="text-sm text-ev-text-muted max-w-xs mx-auto">
                      {scanComplete 
                        ? `The integrity scan detected ${stats.fraud} fraudulent matches and ${stats.suspicious} suspicious patterns in this batch.`
                        : "High-speed biometric cross-reference engine awaiting execution signal. Use LEV-DIST V3 for name verification."}
                    </p>
                  </div>
                  {scanComplete && (
                     <button onClick={fetchVoters} className="text-[10px] font-mono text-ev-gold hover:underline uppercase tracking-widest">
                       Refresh Registry Buffer
                     </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Results Feed */}
          <div className="lg:col-span-5 flex flex-col h-[600px]">
            <h2 className="text-[10px] font-black text-ev-text-muted mb-4 uppercase tracking-[0.4em] flex justify-between">
              Verification Feed
              <span className="opacity-40">SEQ_DESC</span>
            </h2>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              <AnimatePresence initial={false}>
                {scannedResults.map((voter) => (
                  <motion.div
                    key={voter.voterID}
                    layout
                    initial={{ opacity: 0, x: 20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    onClick={() => setSelectedVoter(voter)}
                    className={`group relative p-4 rounded-2xl border transition-all cursor-pointer hover:border-white/20
                      ${voter.riskLevel === "FRAUD" ? "bg-ev-red/5 border-ev-red/40 hover:bg-ev-red/10" :
                        voter.riskLevel === "SUSPICIOUS" ? "bg-ev-saffron/5 border-ev-saffron/40 hover:bg-ev-saffron/10" :
                        "bg-white/5 border-white/5 hover:bg-white/[0.08]"}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-14 rounded-lg bg-ev-navy border border-white/10 flex-shrink-0 grayscale overflow-hidden overflow-hidden">
                        {voter.photoBase64 
                           ? <img src={voter.photoBase64} alt="" className="w-full h-full object-cover" />
                           : <div className="w-full h-full flex items-center justify-center text-xl">👤</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-bold text-white truncate">{voter.name}</h4>
                          <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase
                            ${voter.riskLevel === "FRAUD" ? "bg-ev-red text-white" :
                              voter.riskLevel === "SUSPICIOUS" ? "bg-ev-saffron text-ev-navy" :
                              "bg-ev-green text-white"}`}>
                            {voter.riskLevel}
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-ev-text-muted truncate">{voter.voterID}</p>
                        {voter.fraudSignals?.length > 0 && (
                          <div className="flex gap-2 mt-2">
                             {voter.fraudSignals.map((s, i) => (
                               <span key={i} className="text-[7px] font-bold text-ev-red/80 uppercase">[{s.type}]</span>
                             ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Voter Detail Modal */}
        <AnimatePresence>
          {selectedVoter && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-ev-navy/90 backdrop-blur-xl"
              onClick={() => setSelectedVoter(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-4xl bg-ev-navy-800 rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl relative"
              >
                 <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="p-8 md:p-12 bg-ev-navy flex items-center justify-center">
                       <VoterIDCard voter={selectedVoter} />
                    </div>
                    <div className="p-8 md:p-12 space-y-8 overflow-y-auto max-h-[600px]">
                       <div>
                         <h3 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">Audit Dossier</h3>
                         <p className="text-ev-text-muted text-xs font-mono uppercase tracking-widest">Internal Security Record #VOT_SCAN_{selectedVoter.voterID}</p>
                       </div>

                       <div className="space-y-6">
                          <section>
                            <h4 className="text-[10px] font-black text-ev-text-muted uppercase tracking-[0.3em] mb-4">Biometric Integrity</h4>
                            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-ev-navy flex items-center justify-center">📸</div>
                                  <div>
                                     <p className="text-sm font-bold text-white">Face Template</p>
                                     <p className="text-[10px] text-ev-text-muted font-mono">{selectedVoter.faceDescriptor ? "ENCODED_128_FLT" : "MISSING_DATA"}</p>
                                  </div>
                               </div>
                               <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full ${selectedVoter.photoBase64 ? "bg-ev-green/20 text-ev-green" : "bg-ev-red/20 text-ev-red"}`}>
                                  {selectedVoter.photoBase64 ? "CAPTURED" : "NULL"}
                               </span>
                            </div>
                          </section>

                          <section>
                            <h4 className="text-[10px] font-black text-ev-text-muted uppercase tracking-[0.3em] mb-4">Risk Evaluation</h4>
                            <div className="space-y-3">
                               {selectedVoter.fraudSignals?.length > 0 ? (
                                  selectedVoter.fraudSignals.map((sig, i) => (
                                    <div key={i} className="flex gap-4 p-4 rounded-2xl bg-ev-red/5 border border-ev-red/20">
                                       <ShieldAlert className="w-5 h-5 text-ev-red shrink-0" />
                                       <div>
                                          <p className="text-xs font-black text-ev-red uppercase mb-1">{sig.type}</p>
                                          <p className="text-[11px] text-ev-text-muted leading-relaxed">{sig.detail}</p>
                                       </div>
                                    </div>
                                  ))
                               ) : (
                                  <div className="flex gap-4 p-4 rounded-2xl bg-ev-green/5 border border-ev-green/20">
                                     <CheckCircle className="w-5 h-5 text-ev-green shrink-0" />
                                     <div>
                                        <p className="text-xs font-black text-ev-green uppercase mb-1">Zero Anomalies</p>
                                        <p className="text-[11px] text-ev-text-muted">Identity matches all backend registry parameters.</p>
                                     </div>
                                  </div>
                               )}
                            </div>
                          </section>

                          {selectedVoter.riskLevel === "FRAUD" && (
                            <button
                              onClick={async () => {
                                await axios.post(`/api/fraud/block/${selectedVoter.voterID}`);
                                fetchVoters();
                                setSelectedVoter(null);
                              }}
                              className="w-full py-4 rounded-2xl bg-ev-red text-white font-black text-[11px] uppercase tracking-[0.3em] hover:bg-ev-red/80 transition-all active:scale-95 shadow-xl shadow-ev-red/20"
                            >
                              Terminate Voter Eligibility
                            </button>
                          )}
                       </div>
                    </div>
                 </div>

                 <button 
                  onClick={() => setSelectedVoter(null)}
                  className="absolute top-6 right-6 w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-ev-text-muted hover:text-white hover:bg-white/5 transition-all"
                 >
                   ✕
                 </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
