import React, { useState, useEffect, useRef } from 'react';
import axios from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, Database, ShieldCheck } from 'lucide-react';

export default function VoteLedger({ socket }) {
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const response = await axios.get('/vote/ledger');
        setLedger(response.data.ledger);
        setLoading(false);
      } catch (err) {
        console.error("Ledger fetch error", err);
        setLoading(false);
      }
    };
    fetchLedger();

    if (socket) {
      socket.on('vote:cast', (data) => {
        setLedger(prev => [{
          blockIndex: data.blockIndex,
          receiptHash: data.receiptHash,
          prevHash: data.prevHash,
          voterID: data.voterID,
          timestamp: data.timestamp,
        }, ...prev].slice(0, 20));
      });
      return () => socket.off('vote:cast');
    }
  }, [socket]);

  if (loading) return <div className="p-10 text-center text-ev-text-muted italic">Syncing Ledger...</div>;

  return (
    <div className="ev-card p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Blockchain Ledger</h3>
          <p className="text-[10px] text-ev-green font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-ev-green animate-pulse"></span>
            LIVE IMMUTABLE STREAM
          </p>
        </div>
        <div className="px-3 py-1 bg-ev-gold/10 border border-ev-gold/30 rounded text-[10px] text-ev-gold font-black">
          O(N) INTEGRITY
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide" ref={scrollRef}>
        <AnimatePresence initial={false}>
          {ledger.map((block, i) => (
            <motion.div
              key={block.receiptHash}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              className="bg-ev-navy-800 border border-ev-surface-border rounded-lg p-4 group hover:border-ev-gold/50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black text-ev-text-muted">BLOCK #{block.blockIndex}</span>
                <span className="text-[10px] font-mono text-ev-green">VALID ✓</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-ev-gold/20 flex items-center justify-center text-ev-gold">
                    <span className="text-[10px] font-bold">SHA</span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[10px] text-ev-text-secondary truncate font-mono">HASH: {block.receiptHash}</p>
                    <p className="text-[10px] text-ev-text-muted truncate font-mono opacity-50">PREV: {block.prevHash}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] pt-1">
                  <span className="text-white font-bold">{block.voterID.slice(0, 6)}***</span>
                  <span className="text-ev-text-muted">{new Date(block.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
              
              {/* Connector line */}
              {i < ledger.length - 1 && (
                <div className="absolute left-[26px] bottom-[-14px] w-0.5 h-3 bg-ev-surface-border"></div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
