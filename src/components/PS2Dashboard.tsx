import { motion, AnimatePresence } from "motion/react";
import React, { useState } from "react";
import { Settings, Disc, Box, ChevronRight, Info, AlertTriangle } from "lucide-react";
import PS2Clock from "./PS2Clock";

type Screen = "main" | "browser" | "config" | "emulator" | "running";

export default function PS2Dashboard() {
  const [screen, setScreen] = useState<Screen>("main");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [isEmulatorLoading, setIsEmulatorLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
      setShowError(false);
    }
  };

  const handleRunGame = () => {
    // Attempt to load emulator
    setScreen("running");
  };

  const menuItems = [
    { 
      id: "browser", 
      label: "Browser", 
      icon: <Disc className="w-8 h-8" />,
      desc: "View Memory Cards & Disc content"
    },
    { 
      id: "config", 
      label: "System Configuration", 
      icon: <Settings className="w-8 h-8" />,
      desc: "Date, Time, Video settings"
    },
    { 
      id: "emulator", 
      label: "Run Game", 
      icon: <Box className="w-8 h-8" />,
      desc: "Boot a PS2 ISO file"
    }
  ];

  const renderScreen = () => {
    switch (screen) {
      case "main":
        return (
          <div className="flex flex-col items-center justify-center gap-16">
            <PS2Clock />
            
            <div className="flex flex-col gap-4 w-[400px]">
              {menuItems.map((item, idx) => (
                <motion.button
                  key={item.id}
                  onClick={() => setScreen(item.id as Screen)}
                  onMouseEnter={() => setSelectedIdx(idx)}
                  className={`
                    flex items-center justify-between p-4 rounded-lg transition-all duration-300
                    ${selectedIdx === idx ? 'bg-white/20 border-l-4 border-blue-400' : 'bg-transparent border-l-4 border-transparent'}
                  `}
                  whileHover={{ x: 10 }}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-blue-300">{item.icon}</span>
                    <div className="flex flex-col items-start">
                      <span className="text-white font-bold tracking-widest uppercase text-sm">
                        {item.label}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-blue-400 ${selectedIdx === idx ? 'opacity-100' : 'opacity-0'}`} />
                </motion.button>
              ))}
            </div>

            <div className="absolute bottom-10 left-10 text-white/40 text-xs flex items-center gap-2">
              <Info className="w-4 h-4" />
              <span>Use mouse or keyboard to navigate</span>
            </div>
          </div>
        );
      
      case "browser":
        return (
          <div className="flex flex-col items-center gap-10">
            <div className="text-white text-2xl tracking-[0.5em] font-bold uppercase mb-10">Browser</div>
            <div className="flex gap-20">
              {[1, 2].map(id => (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-4 p-8 bg-white/5 border border-white/10 rounded-xl"
                >
                  <div className="w-32 h-40 bg-zinc-800 rounded-md border-b-8 border-zinc-900 shadow-xl relative overflow-hidden">
                    <div className="absolute top-2 left-2 right-2 h-4 bg-zinc-700 rounded-sm" />
                    <div className="mt-12 text-center text-[10px] text-white/50">MEMORY CARD (8MB)</div>
                    <div className="mt-1 text-center text-[8px] text-blue-400">MagicGate</div>
                  </div>
                  <span className="text-white/60 text-xs tracking-widest font-mono">SLOT {id}</span>
                </motion.div>
              ))}
            </div>
            <button 
              onClick={() => setScreen("main")}
              className="mt-10 px-8 py-2 border border-white/30 text-white hover:bg-white/10 transition-colors uppercase text-xs tracking-widest"
            >
              Back to Main
            </button>
          </div>
        );

      case "emulator":
        return (
          <div className="max-w-3xl w-full bg-black/80 border border-blue-500/30 p-8 sm:p-12 rounded-3xl backdrop-blur-2xl flex flex-col items-center gap-10 shadow-[0_0_100px_rgba(59,130,246,0.15)] relative">
            
            {/* Limitation Modal/Overlay */}
            <AnimatePresence>
              {showError && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute inset-0 z-50 bg-black/95 rounded-3xl flex flex-col items-center justify-center p-8 text-center border-2 border-red-500/50"
                >
                  <AlertTriangle className="w-16 h-16 text-yellow-500 mb-6" />
                  <h3 className="text-xl font-bold tracking-widest uppercase text-white mb-4">Hardware Limitation</h3>
                  <p className="text-red-300 font-mono text-sm leading-relaxed max-w-lg mb-6">
                    FATAL ERROR: Emotion Engine architecture cannot be natively executed within this WebAssembly context. 
                  </p>
                  <p className="text-white/80 text-sm max-w-md mb-8">
                    This is a dashboard UI simulation. To run high-end PS2 games smoothly, you will need to host your own emulator core bytes or use a standalone native emulator like <strong>PCSX2</strong>. Ensure your browser supports WebGL2 and high-performance WASM.
                  </p>
                  <button 
                    onClick={() => setShowError(false)}
                    className="px-8 py-3 bg-red-500/20 text-red-100 hover:bg-red-500/40 rounded-full font-bold uppercase tracking-widest text-xs transition-colors"
                  >
                    I Understand
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col items-center gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              >
                <Disc className="w-24 h-24 text-blue-400 opacity-50" />
              </motion.div>
              <h2 className="text-white text-4xl font-bold tracking-[0.3em] uppercase text-center">Emu-Core v1.0</h2>
              <div className="h-[2px] w-48 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
                <h3 className="text-blue-300 font-bold uppercase tracking-widest text-xs">System Status</h3>
                <div className="font-mono text-[10px] space-y-1 text-white/60">
                  <div className="flex justify-between"><span>EE Core:</span> <span className="text-green-400">JIT Ready</span></div>
                  <div className="flex justify-between"><span>GS Logic:</span> <span className="text-green-400">Vulkan OK</span></div>
                  <div className="flex justify-between"><span>SPU-2:</span> <span className="text-yellow-400">Stereo Logic</span></div>
                  <div className="flex justify-between"><span>WASM:</span> <span className="text-blue-400">v2.3 Threads</span></div>
                </div>
              </div>

              <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
                <h3 className="text-blue-300 font-bold uppercase tracking-widest text-xs">Required Files</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>BIOS Module (Embedded)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/70">
                    <div className={`w-2 h-2 rounded-full ${fileName ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                    <span>{fileName ? 'ROM Loaded' : 'Waiting for Game ISO...'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <label className={`w-full h-48 border-2 border-dashed ${fileName ? 'border-green-500/40 bg-green-500/5' : 'border-blue-500/20'} rounded-2xl flex flex-col items-center justify-center gap-4 hover:bg-blue-500/10 cursor-pointer transition-all group overflow-hidden relative`}>
              <input type="file" className="hidden" accept=".iso,.elf,.bin" onChange={handleFileChange} />
              
              {fileName ? (
                <div className="text-center px-6">
                  <span className="text-green-400 text-4xl mb-2 block">✓</span>
                  <span className="text-green-300 font-bold uppercase tracking-widest block text-sm mb-1">File Loaded</span>
                  <span className="text-white/60 text-xs font-mono">{fileName}</span>
                </div>
              ) : (
                <>
                  <motion.div 
                    animate={{ y: [0, -10, 0] }} 
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-4xl group-hover:scale-125 transition-transform"
                  >
                    📥
                  </motion.div>
                  <div className="text-center px-6">
                    <span className="text-white font-bold uppercase tracking-widest block text-sm">LOAD GAME FILE</span>
                    <span className="text-white/40 text-[10px] uppercase tracking-tighter mt-1 block">Drag & Drop .ISO / .ELF file here</span>
                  </div>
                </>
              )}
              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
            </label>

            <div className="flex gap-4">
              <button 
                onClick={() => {
                  setScreen("main");
                  setShowError(false);
                  setFileName(null);
                }}
                className="px-10 py-3 border border-white/20 text-white/70 hover:bg-white/10 rounded-full transition-all uppercase text-[10px] font-bold tracking-[0.2em]"
              >
                Back to Menu
              </button>
              <button 
                onClick={handleRunGame}
                disabled={!fileName}
                className={`px-10 py-3 rounded-full transition-all uppercase text-[10px] font-bold tracking-[0.2em] ${
                  fileName 
                    ? 'bg-blue-600 text-white hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] cursor-pointer' 
                    : 'bg-blue-600/20 border border-blue-500/40 text-blue-300 opacity-50 cursor-not-allowed'
                }`}
              >
                Run Emulator
              </button>
            </div>
          </div>
        );

      case "running":
        return (
          <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10 px-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="text-white/50 font-mono text-xs uppercase tracking-widest">
                  Emulator Running: {fileName}
                </span>
              </div>
              <button 
                onClick={() => {
                  setScreen("emulator");
                  // Optional: Refresh page to clear WASM memory if needed
                  window.location.reload();
                }}
                className="px-4 py-2 bg-white/10 hover:bg-red-500/20 text-white text-[10px] font-bold tracking-widest rounded border border-white/20 transition-colors"
              >
                EXIT EMULATOR
              </button>
            </div>

            {/* Emulator Canvas Container */}
            <div className="relative w-full max-w-4xl aspect-[4/3] bg-zinc-900 shadow-2xl border border-white/10 flex items-center justify-center overflow-hidden">
              <canvas 
                id="canvas" 
                className="w-full h-full object-contain"
                onContextMenu={(e) => e.preventDefault()}
              />
              
              {!isEmulatorLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-6">
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-blue-400 text-4xl animate-spin">💿</div>
                    <span className="text-white font-bold tracking-widest text-sm mt-4">INITIALIZING VIRTUAL DISK...</span>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setIsEmulatorLoading(true);
                      const script = document.createElement('script');
                      script.src = '/play.js';
                      script.async = true;
                      script.onload = () => {
                        console.log("Play! JS loaded successfully");
                      };
                      script.onerror = () => {
                        alert("Error: play.js not found in public folder or failed to load.");
                        setScreen("emulator");
                        setIsEmulatorLoading(false);
                      };
                      document.body.appendChild(script);
                    }}
                    className="px-8 py-3 bg-blue-600 text-white rounded-full font-bold uppercase tracking-widest text-xs hover:bg-blue-500 shadow-lg shadow-blue-500/20"
                  >
                    BOOT ENGINE
                  </button>
                </div>
              )}
            </div>

            <div className="mt-8 text-white/20 font-mono text-[10px] flex gap-8">
              <span>GS: OpenGL / Vulkan Hybrid</span>
              <span>MEMORY: 32MB Main RAM</span>
              <span>INPUT: Keyboard Enabled</span>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-white">
            Under Construction / কাজ চলছে...
            <button onClick={() => setScreen("main")} className="block mt-4 text-blue-400 underline">Back</button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-5xl"
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
