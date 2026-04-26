import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useScrollReveal(selector = ".reveal") {
  useEffect(() => {
    // Kill existing triggers to avoid duplicates on re-render
    ScrollTrigger.getAll().forEach(t => t.kill());

    const elements = gsap.utils.toArray(selector);
    
    elements.forEach((el) => {
      gsap.fromTo(el,
        { 
          opacity: 0, 
          y: 40, 
          scale: 0.98 
        },
        {
          opacity: 1, 
          y: 0, 
          scale: 1, 
          duration: 0.8, 
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none reverse"
          }
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [selector]);
}
