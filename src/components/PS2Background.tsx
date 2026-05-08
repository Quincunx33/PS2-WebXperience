import { motion } from "motion/react";

export default function PS2Background() {
  return (
    <div className="fixed inset-0 bg-[#000022] overflow-hidden -z-10">
      {/* Deep blue atmospheric fog */}
      <motion.div
        className="absolute inset-0 opacity-40 bg-radial-gradient from-[#0044ff] via-transparent to-transparent"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [-20, 20, -20],
          y: [-10, 10, -10],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          background: "radial-gradient(circle at 30% 30%, #0044ff 0%, transparent 60%)",
        }}
      />
      
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
          x: [20, -20, 20],
          y: [10, -10, 10],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          background: "radial-gradient(circle at 70% 70%, #0022cc 0%, transparent 60%)",
        }}
      />

      {/* Floating particles/noise */}
      <div 
        className="absolute inset-0 mix-blend-overlay opacity-10"
        style={{
          backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")',
        }}
      />
      
      {/* Darkness vignette */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-[#00000088]" />
    </div>
  );
}
