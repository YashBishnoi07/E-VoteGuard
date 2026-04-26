import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Bot, X, Sparkles, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function FraudAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Systems online. I am the AI Fraud Monitoring Assistant. How can I verify electoral integrity for you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Mock AI Response Logic based on Keywords
    setTimeout(() => {
      let response = "I've analyzed your query against our DAA detection logs. The system currently shows 99.8% integrity across all regional nodes.";
      
      const lowInput = input.toLowerCase();
      if (lowInput.includes('how') || lowInput.includes('algorithm')) {
        response = "Our system utilizes 5 core algorithms: SHA-256 for O(1) identity mapping, Merge Sort for pattern analysis, BFS for graph clustering, Greedy scoring for real-time risk, and DP for behavioral sequence analysis.";
      } else if (lowInput.includes('fraud') || lowInput.includes('risk')) {
        response = "Current high-risk triggers include device mismatches and burst voting patterns (detected via O(n log n) sliding window). I recommend checking the Regional Analysis tab for spatial hotspots.";
      } else if (lowInput.includes('blockchain') || lowInput.includes('ledger')) {
        response = "The vote ledger utilizes cryptographic chaining where each block contains the hash of the preceding block (O(n) integrity). This ensures no vote can be altered post-entry.";
      }

      setMessages(prev => [...prev, { role: 'ai', text: response }]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <>
      {/* Floating Trigger */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-2xl bg-ev-saffron text-white shadow-[0_0_40px_rgba(255,107,0,0.4)] flex items-center justify-center z-50 border border-ev-gold/30 hover:shadow-[0_0_50px_rgba(255,107,0,0.6)]"
      >
        <Bot size={32} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-24 right-8 w-[400px] h-[550px] ev-card seal-border flex flex-col z-50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]"
          >
            {/* Header */}
            <div className="p-4 border-b border-ev-surface-border bg-gradient-to-r from-ev-navy-800 to-ev-surface-card rounded-t-xl flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-ev-saffron/10 border border-ev-saffron/30 flex items-center justify-center text-ev-saffron">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 className="text-white font-black text-sm uppercase tracking-tighter">Fraud Assistant</h4>
                  <p className="text-[10px] text-ev-green font-bold flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-ev-green animate-pulse"></span>
                    AI ENGINE ACTIVE
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-ev-text-muted hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide" ref={scrollRef}>
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-ev-saffron text-white rounded-br-none shadow-lg' 
                      : 'bg-ev-navy-800 border border-ev-surface-border text-ev-text-secondary rounded-bl-none'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-ev-navy-800 border border-ev-surface-border p-3 rounded-2xl rounded-bl-none">
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-ev-saffron rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                      <div className="w-1 h-1 bg-ev-saffron rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-1 h-1 bg-ev-saffron rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 border-t border-ev-surface-border bg-ev-navy/50">
              <div className="relative">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about AI risk analysis..."
                  className="w-full bg-ev-navy-800 border border-ev-surface-border rounded-xl py-3 pl-4 pr-12 text-xs text-white focus:border-ev-gold outline-none"
                />
                <button 
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-ev-gold text-ev-navy flex items-center justify-center hover:bg-ev-gold-light transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
              <div className="flex justify-center gap-2 mt-4">
                <div className="flex items-center gap-1 text-[8px] font-black text-ev-text-muted uppercase tracking-widest">
                  <ShieldCheck size={10} className="text-ev-green" /> Verifiable
                </div>
                <div className="flex items-center gap-1 text-[8px] font-black text-ev-text-muted uppercase tracking-widest">
                  <AlertTriangle size={10} className="text-ev-saffron" /> Real-time
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
