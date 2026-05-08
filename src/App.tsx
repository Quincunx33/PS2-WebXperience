import { useState, useEffect } from "react";
import PS2Startup from "./components/PS2Startup";
import PS2Dashboard from "./components/PS2Dashboard";
import PS2Background from "./components/PS2Background";
import { soundService } from "./services/soundService";
import { motion, AnimatePresence } from "motion/react";

type AppState = "intro" | "startup" | "dashboard";

export default function App() {
  const [state, setState] = useState<AppState>("intro");

  useEffect(() => {
    // Enable sound via user interaction constraint handling
    const enableAudio = () => {
      soundService.init();
      window.removeEventListener('click', enableAudio);
      window.removeEventListener('keydown', enableAudio);
    };
    window.addEventListener('click', enableAudio);
    window.addEventListener('keydown', enableAudio);
    return () => {
      window.removeEventListener('click', enableAudio);
      window.removeEventListener('keydown', enableAudio);
    };
  }, []);

  const handleStart = () => {
    soundService.init();
    soundService.playStartup();
    setState("startup");
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">
      <PS2Background />
      
      <AnimatePresence mode="wait">
        {state === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex flex-col items-center justify-center z-[100] bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-2xl sm:text-4xl font-bold tracking-[0.5em] mb-12 text-center px-4"
            >
              PS2 WEB EXPERIENCE
            </motion.div>
            
            <button
              onClick={handleStart}
              onMouseEnter={() => soundService.playHover()}
              className="group relative px-12 py-4 overflow-hidden rounded-full border border-white/20 hover:border-white/50 transition-colors"
            >
              <div className="relative z-10 flex flex-col items-center">
                <span className="text-xl font-bold tracking-widest">START</span>
              </div>
              <motion.div 
                className="absolute inset-0 bg-blue-600/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" 
              />
            </button>

            <div className="absolute bottom-10 text-white/30 text-[10px] uppercase tracking-[0.2em] text-center max-w-md px-8 leading-relaxed">
              Legal: This is a fan-made interface simulation. 
              Always use your own legally owned BIOS and games.
            </div>
          </motion.div>
        )}

        {state === "startup" && (
          <PS2Startup onComplete={() => setState("dashboard")} />
        )}

        {state === "dashboard" && (
          <div className="min-h-screen flex flex-col items-center justify-start sm:justify-center p-4 overflow-y-auto">
            <PS2Dashboard />
          </div>
        )}
      </AnimatePresence>

      {/* Retro Scanlines Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[200] opacity-[0.03] overflow-hidden">
        <div 
          className="absolute inset-0 w-full h-[200%]"
          style={{
            background: "repeating-linear-gradient(0deg, #000 0px, #000 2px, transparent 2px, transparent 4px)"
          }}
        />
      </div>
    </div>
  );
}
