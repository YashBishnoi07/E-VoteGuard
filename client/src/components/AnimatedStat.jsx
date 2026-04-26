import { useEffect, useRef } from "react";
import { CountUp } from "countup.js";
import { useInView } from "react-intersection-observer";

export function AnimatedStat({ value, label, icon: Icon, color = "ev-saffron" }) {
  const { ref: inViewRef, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const countUpRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (countUpRef.current) {
      instanceRef.current = new CountUp(countUpRef.current, value, {
        duration: 2.5,
        separator: ",",
        startVal: 0,
        useEasing: true,
      });
    }
  }, [value]);

  useEffect(() => {
    if (inView && instanceRef.current) {
      instanceRef.current.start();
    }
  }, [inView]);

  const colorMap = {
    "ev-saffron": "text-ev-saffron",
    "ev-green": "text-ev-green",
    "ev-red": "text-ev-red",
    "ev-gold": "text-ev-gold",
    "ev-navy": "text-ev-navy",
  };

  const glowMap = {
    "ev-saffron": "rgba(255, 107, 0, 0.2)",
    "ev-green": "rgba(0, 168, 107, 0.2)",
    "ev-red": "rgba(192, 57, 43, 0.2)",
    "ev-gold": "rgba(212, 175, 55, 0.2)",
  };

  return (
    <div ref={inViewRef} className="ev-card seal-border p-6 flex flex-col items-center justify-center text-center transition-transform hover:scale-105 duration-300">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" 
           style={{ background: glowMap[color] || 'rgba(255,255,255,0.05)' }}>
        {Icon && <Icon className={`w-6 h-6 ${colorMap[color] || 'text-white'}`} />}
      </div>
      <div ref={countUpRef} className={`text-4xl font-black mb-1 ${colorMap[color] || 'text-white'}`} />
      <p className="text-ev-text-secondary font-medium uppercase tracking-wider text-xs">{label}</p>
    </div>
  );
}
