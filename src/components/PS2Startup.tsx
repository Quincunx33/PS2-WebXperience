import { motion } from "motion/react";
import { useEffect, useState } from "react";

export default function PS2Startup({ onComplete }: { onComplete: () => void }) {
  const [showTowers, setShowTowers] = useState(true);
  const [showLogo, setShowLogo] = useState(false);

  useEffect(() => {
    // Stage 1: Towers (0-3s)
    // Stage 2: Logo (3-6s)
    // Stage 3: Finish (6s+)
    const logoTimer = setTimeout(() => setShowLogo(true), 3000);
    const towersTimer = setTimeout(() => setShowTowers(false), 5000);
    const completeTimer = setTimeout(onComplete, 7000);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(towersTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  // Generate 20+ towers with random height
  const towers = Array.from({ length: 32 }).map((_, i) => ({
    id: i,
    height: Math.random() * 200 + 50,
    x: (Math.random() - 0.5) * 800,
    z: (Math.random() - 0.5) * 1000 - 500,
    delay: Math.random() * 2,
  }));

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden z-50">
      {showTowers && (
        <div className="relative perspective-1000 w-full h-full flex items-center justify-center translate-z-0">
          {towers.map((t) => (
            <motion.div
              key={t.id}
              className="absolute bg-white/20 border border-white/10"
              initial={{ height: 0, opacity: 0, scaleZ: 1 }}
              animate={{ height: t.height, opacity: 0.15 }}
              transition={{
                delay: t.delay,
                duration: 2,
                ease: "easeOut",
              }}
              style={{
                width: 20,
                bottom: "50%",
                left: `calc(50% + ${t.x}px)`,
                transform: `rotateX(-45deg) translateZ(${t.z}px)`,
                boxShadow: "0 0 10px rgba(255,255,255,0.2)",
              }}
            />
          ))}
          
          {/* Central glow during towers */}
          <motion.div
            className="absolute w-[400px] h-[400px] rounded-full bg-blue-500 blur-[100px] opacity-0"
            animate={{ opacity: [0, 0.2, 0] }}
            transition={{ duration: 4, times: [0, 0.5, 1] }}
          />
        </div>
      )}

      {showLogo && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="text-white font-bold tracking-[0.2em] text-4xl sm:text-6xl flex items-baseline">
            <span>Sony Computer Entertainment</span>
          </div>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 0.5, duration: 1 }}
            className="h-[1px] bg-white/50"
          />
          <div className="text-blue-400 font-bold tracking-[0.5em] text-2xl mt-4">
            PlayStation 2
          </div>
        </motion.div>
      )}
      
      {/* Sound simulation via visual cues if audio is restricted */}
      <motion.div 
        className="absolute bottom-8 text-white/20 text-xs uppercase tracking-widest"
        animate={{ opacity: [0, 1, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        Initializing Memory Cards...
      </motion.div>
    </div>
  );
}
