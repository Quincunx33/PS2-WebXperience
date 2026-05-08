import { motion } from "motion/react";
import { useEffect, useState } from "react";

export default function PS2Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const atoms = 12;
  const radius = 120;

  return (
    <div className="relative w-[300px] h-[300px] flex items-center justify-center">
      {/* Central Blue Sphere */}
      <div className="w-16 h-16 rounded-full bg-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.8)] relative z-10">
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent to-white/40" />
      </div>

      {/* Orbiting Atoms */}
      {Array.from({ length: atoms }).map((_, i) => {
        const angle = (i / atoms) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        return (
          <motion.div
            key={i}
            className="absolute"
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 20 + i * 2,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              width: radius * 2,
              height: 2,
              transformOrigin: "center",
            }}
          >
            <motion.div
              className="w-3 h-3 rounded-full bg-white/60 absolute right-0"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.4, 0.8, 0.4],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.1,
              }}
            />
          </motion.div>
        );
      })}

      {/* Digital Time Display (Bottom) */}
      <div className="absolute -bottom-16 text-white/80 font-mono tracking-[0.3em] text-xl">
        {time.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
      
      {/* Date (Subtle) */}
      <div className="absolute -bottom-24 text-white/40 font-mono text-xs uppercase tracking-widest">
        {time.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
      </div>
    </div>
  );
}
