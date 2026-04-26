import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

export default function ElectionParticles() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particleOptions = {
    background: { color: { value: "transparent" } },
    particles: {
      number: { value: 60, density: { enable: true } },
      color: { value: ["#FF6B00", "#00A86B", "#D4AF37", "#F0F4F8"] },
      shape: { type: ["circle", "triangle"] },
      opacity: { 
        value: { min: 0.1, max: 0.5 }, 
        animation: { enable: true, speed: 1 } 
      },
      size: { value: { min: 1, max: 3 } },
      move: { 
        enable: true, 
        speed: 0.8, 
        direction: "none", 
        random: true, 
        outModes: "out" 
      },
      links: { 
        enable: true, 
        color: "#243044", 
        distance: 120, 
        opacity: 0.2, 
        width: 1 
      }
    },
    interactivity: {
      events: { 
        onHover: { enable: true, mode: "repulse" }, 
        onClick: { enable: true, mode: "push" } 
      },
      modes: { 
        repulse: { distance: 80 }, 
        push: { quantity: 3 } 
      }
    }
  };

  if (!init) return null;

  return (
    <div className="particle-container">
      <Particles options={particleOptions} />
    </div>
  );
}
