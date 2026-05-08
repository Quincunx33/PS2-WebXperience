import { motion, AnimatePresence } from "motion/react";
import React, { useState, useEffect } from "react";
import { Settings, Disc, Box, ChevronRight, Info, AlertTriangle, Database, HardDrive, Trash2, Cpu } from "lucide-react";
import PS2Clock from "./PS2Clock";
import { StorageService, StoredGame } from "../services/storageService";
import PS2VirtualController from "./PS2VirtualController";

type Screen = "main" | "storage" | "config" | "emulator" | "running";

type GameMetadata = Omit<StoredGame, 'data'>;

export default function PS2Dashboard() {
  const [screen, setScreen] = useState<Screen>("main");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [isEmulatorLoading, setIsEmulatorLoading] = useState(false);
  const [storedGames, setStoredGames] = useState<GameMetadata[]>([]);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);

  // System Configuration State
  const [config, setConfig] = useState({
    resolution: "480p",
    showFPS: true,
    scanlines: false,
    ramAllocation: "1GB",
    virtualControls: true,
    overlayOpacity: 40,
    vControllerSize: "md", // sm, md, lg
    keyMapping: {
      CROSS: "k",
      CIRCLE: "l",
      SQUARE: "j",
      TRIANGLE: "i",
      UP: "w",
      DOWN: "s",
      LEFT: "a",
      RIGHT: "d",
      START: "Enter",
      SELECT: "Shift"
    }
  });

  const [activeMappingKey, setActiveMappingKey] = useState<string | null>(null);

  // Load games from real IndexedDB
  const refreshStorage = async () => {
    try {
      const games = await StorageService.getAllGames();
      setStoredGames(games);
    } catch (err) {
      console.error("Storage Error:", err);
    }
  };

  useEffect(() => {
    refreshStorage();
  }, [screen]);

  useEffect(() => {
    if (activeMappingKey) {
      const handleKeyDown = (e: KeyboardEvent) => {
        e.preventDefault();
        setConfig(prev => ({
          ...prev,
          keyMapping: { ...prev.keyMapping, [activeMappingKey]: e.key }
        }));
        setActiveMappingKey(null);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [activeMappingKey]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFileName(file.name);
      
      try {
        setIsInstalling(true);
        setInstallProgress(0);
        await StorageService.saveGame(file, (p) => setInstallProgress(p));
        await refreshStorage();
      } catch (err: any) {
        alert(err.message || "Failed to save game to IndexedDB");
        setFileName(null);
      } finally {
        setIsInstalling(false);
      }
    }
  };

  const deleteGame = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this game from storage?")) {
      await StorageService.deleteGame(id);
      await refreshStorage();
    }
  };

  const handleRunGame = () => {
    setScreen("running");
  };

  const menuItems = [
    { 
      id: "storage", 
      label: "System Storage", 
      icon: <Database className="w-8 h-8" />,
      desc: "Manage Installed Games & Save Data"
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
            
            <div className="flex flex-col gap-3 w-full max-w-[320px] sm:max-w-[400px]">
              {menuItems.map((item, idx) => (
                <motion.button
                  key={item.id}
                  onClick={() => setScreen(item.id as Screen)}
                  onMouseEnter={() => setSelectedIdx(idx)}
                  className={`
                    flex items-center justify-between p-3 sm:p-4 rounded-xl transition-all duration-300
                    ${selectedIdx === idx ? 'bg-white/20 border-l-4 border-blue-400' : 'bg-transparent border-l-4 border-transparent'}
                  `}
                  whileHover={{ x: 10 }}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="text-blue-300">
                      {React.cloneElement(item.icon as React.ReactElement, { className: "w-6 h-6 sm:w-8 sm:h-8" })}
                    </span>
                    <div className="flex flex-col items-start overflow-hidden">
                      <span className="text-white font-bold tracking-widest uppercase text-xs sm:text-sm truncate w-full">
                        {item.label}
                      </span>
                      <span className="text-gray-400 text-[9px] sm:text-[10px] uppercase tracking-tighter truncate w-full">
                        {item.desc}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0 ${selectedIdx === idx ? 'opacity-100' : 'opacity-0'}`} />
                </motion.button>
              ))}
            </div>

            <div className="absolute bottom-10 left-10 text-white/40 text-xs flex items-center gap-2">
              <Info className="w-4 h-4" />
              <span>Use mouse or keyboard to navigate</span>
            </div>
          </div>
        );
      
      case "storage":
        return (
          <div className="flex flex-col items-center gap-6 sm:gap-8 w-full max-w-4xl mx-auto px-2">
            <div className="text-white text-xl sm:text-3xl tracking-[0.2em] sm:tracking-[0.4em] font-bold uppercase flex items-center gap-3 sm:gap-4 text-center">
              <HardDrive className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
              SYSTEM STORAGE
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 w-full">
              {/* Virtual HDD Status */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col gap-4">
                <h3 className="text-blue-300 font-bold uppercase tracking-widest text-[10px] sm:text-xs text-center lg:text-left">Drive 0: INTERNAL HDD</h3>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "35%" }}
                    className="h-full bg-blue-500"
                  />
                </div>
                <div className="flex justify-between text-[9px] sm:text-[10px] text-white/40 font-mono">
                  <span>USED: 14.2 GB</span>
                  <span>FREE: 25.8 GB</span>
                </div>
              </div>

              {/* Game List */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col gap-4 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
                <h3 className="text-blue-300 font-bold uppercase tracking-widest text-[10px] sm:text-xs text-center lg:text-left">Installed Games (IndexedDB)</h3>
                <div className="flex flex-col gap-2">
                  {storedGames.length === 0 ? (
                    <div className="text-white/20 text-[10px] sm:text-xs italic py-8 text-center uppercase tracking-widest leading-loose">
                      No games detected in storage.<br/>
                      Upload a file in 'Run Game' to see it here.
                    </div>
                  ) : (
                    storedGames.map((game) => (
                      <motion.div
                        key={game.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg group transition-colors"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <Disc className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-white text-xs font-bold truncate max-w-[120px] sm:max-w-[180px]">{game.name}</span>
                            <span className="text-[9px] sm:text-[10px] text-white/40">
                              {(game.size / (1024 * 1024)).toFixed(1)} MB • {game.type} • {new Date(game.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => deleteGame(game.id, e)}
                          className="p-2 lg:opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded transition-all flex-shrink-0"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <button 
              onClick={() => setScreen("main")}
              className="mt-6 px-10 py-3 border border-white/20 text-white/70 hover:bg-white/10 rounded-full transition-all uppercase text-[10px] font-bold tracking-[0.2em]"
            >
              Back to Menu
            </button>
          </div>
        );

      case "emulator":
        return (
          <div className="max-w-3xl w-full bg-black/80 border border-blue-500/30 p-6 sm:p-12 rounded-3xl backdrop-blur-2xl flex flex-col items-center gap-8 sm:gap-10 shadow-[0_0_100px_rgba(59,130,246,0.15)] relative mx-auto">
            
            {/* Limitation Modal/Overlay */}
            <AnimatePresence>
              {showError && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute inset-0 z-50 bg-black/95 rounded-3xl flex flex-col items-center justify-center p-6 text-center border-2 border-red-500/50"
                >
                  <AlertTriangle className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-500 mb-4 sm:mb-6" />
                  <h3 className="text-lg sm:text-xl font-bold tracking-widest uppercase text-white mb-3 sm:mb-4">Hardware Limitation</h3>
                  <p className="text-red-300 font-mono text-[10px] sm:text-sm leading-relaxed max-w-lg mb-4 sm:mb-6">
                    FATAL ERROR: Emotion Engine architecture cannot be natively executed within this WebAssembly context. 
                  </p>
                  <p className="text-white/80 text-[11px] sm:text-sm max-w-md mb-6 sm:mb-8">
                    This is a dashboard UI simulation. To run high-end PS2 games smoothly, you will need to host your own emulator core bytes or use a standalone native emulator like <strong>PCSX2</strong>. Ensure your browser supports WebGL2 and high-performance WASM.
                  </p>
                  <button 
                    onClick={() => setShowError(false)}
                    className="px-6 py-2 sm:px-8 sm:py-3 bg-red-500/20 text-red-100 hover:bg-red-500/40 rounded-full font-bold uppercase tracking-widest text-[10px] sm:text-xs transition-colors"
                  >
                    I Understand
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              >
                <Disc className="w-16 h-16 sm:w-24 sm:h-24 text-blue-400 opacity-50" />
              </motion.div>
              <h2 className="text-white text-2xl sm:text-4xl font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase text-center">Emu-Core v1.0</h2>
              <div className="h-[2px] w-32 sm:w-48 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full">
              <div className="bg-white/5 p-4 sm:p-6 rounded-2xl border border-white/10 space-y-3 sm:space-y-4">
                <h3 className="text-blue-300 font-bold uppercase tracking-widest text-[10px] sm:text-xs">System Status</h3>
                <div className="font-mono text-[9px] sm:text-[10px] space-y-1 text-white/60">
                  <div className="flex justify-between"><span>EE Core:</span> <span className="text-green-400">JIT Ready</span></div>
                  <div className="flex justify-between"><span>GS Logic:</span> <span className="text-green-400">Vulkan OK</span></div>
                  <div className="flex justify-between"><span>SPU-2:</span> <span className="text-yellow-400">Stereo Logic</span></div>
                  <div className="flex justify-between"><span>WASM:</span> <span className="text-blue-400">v2.3 Threads</span></div>
                </div>
              </div>

              <div className="bg-white/5 p-4 sm:p-6 rounded-2xl border border-white/10 space-y-3 sm:space-y-4">
                <h3 className="text-blue-300 font-bold uppercase tracking-widest text-[10px] sm:text-xs">Required Files</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] sm:text-xs text-white/50">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>BIOS Module (Embedded)</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] sm:text-xs text-white/70">
                    <div className={`w-2 h-2 rounded-full ${fileName ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                    <span>{fileName ? 'ROM Loaded' : 'Waiting for Game ISO...'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <label className={`w-full h-32 sm:h-48 border-2 border-dashed ${fileName ? 'border-green-500/40 bg-green-500/5' : 'border-blue-500/20'} rounded-2xl flex flex-col items-center justify-center gap-3 sm:gap-4 hover:bg-blue-500/10 cursor-pointer transition-all group overflow-hidden relative`}>
              <input type="file" className="hidden" accept=".iso,.elf,.bin" onChange={handleFileChange} disabled={isInstalling} />
              
              {isInstalling ? (
                <div className="flex flex-col items-center gap-3 w-full px-12">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="text-3xl"
                  >
                    ⚙️
                  </motion.div>
                  <div className="w-full h-1.5 bg-blue-900/50 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-blue-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${installProgress}%` }}
                    />
                  </div>
                  <span className="text-blue-300 font-bold uppercase tracking-widest text-[10px] sm:text-xs">
                    Installing: {installProgress}%
                  </span>
                </div>
              ) : fileName ? (
                <div className="text-center px-4">
                  <span className="text-green-400 text-3xl sm:text-4xl mb-1 sm:mb-2 block">✓</span>
                  <span className="text-green-300 font-bold uppercase tracking-widest block text-[10px] sm:text-sm mb-1">File Loaded</span>
                  <span className="text-white/60 text-[9px] sm:text-xs font-mono truncate max-w-[200px] block mx-auto">{fileName}</span>
                </div>
              ) : (
                <>
                  <motion.div 
                    animate={{ y: [0, -10, 0] }} 
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-3xl sm:text-4xl group-hover:scale-125 transition-transform"
                  >
                    📥
                  </motion.div>
                  <div className="text-center px-4">
                    <span className="text-white font-bold uppercase tracking-widest block text-[10px] sm:text-sm">LOAD GAME FILE</span>
                    <span className="text-white/40 text-[9px] uppercase tracking-tighter mt-1 block">Drag & Drop .ISO / .ELF file here</span>
                  </div>
                </>
              )}
              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
            </label>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
              <button 
                onClick={() => {
                  setScreen("main");
                  setShowError(false);
                  setFileName(null);
                }}
                className="w-full sm:w-auto px-10 py-3 border border-white/20 text-white/70 hover:bg-white/10 rounded-full transition-all uppercase text-[9px] sm:text-[10px] font-bold tracking-[0.2em]"
              >
                Back to Menu
              </button>
              <button 
                onClick={handleRunGame}
                disabled={!fileName}
                className={`w-full sm:w-auto px-10 py-3 rounded-full transition-all uppercase text-[9px] sm:text-[10px] font-bold tracking-[0.2em] ${
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

      case "config":
        return (
          <div className="flex flex-col items-center gap-6 sm:gap-8 w-full max-w-4xl mx-auto px-4">
            <div className="text-white text-xl sm:text-3xl tracking-[0.2em] sm:tracking-[0.4em] font-bold uppercase flex items-center gap-3 sm:gap-4 text-center">
              <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
              SYSTEM CONFIGURATION
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
              {/* Graphics Settings */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4">
                <h3 className="text-blue-300 font-bold uppercase tracking-widest text-[10px] sm:text-xs">Graphics Engine</h3>
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-white/40 uppercase">Internal Resolution</span>
                    <div className="flex gap-2">
                       {["360p", "480p", "720p"].map(res => (
                        <button 
                          key={res} 
                          onClick={() => setConfig({ ...config, resolution: res })}
                          className={`flex-1 py-2 rounded-lg border text-[10px] uppercase font-bold transition-all ${config.resolution === res ? 'bg-blue-500/20 border-blue-400 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}
                        >
                          {res}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/40 uppercase">Show FPS Counter</span>
                    <div 
                      onClick={() => setConfig({ ...config, showFPS: !config.showFPS })}
                      className={`w-10 h-5 border transition-colors rounded-full relative cursor-pointer ${config.showFPS ? 'bg-blue-500/20 border-blue-500/50' : 'bg-white/5 border-white/10'}`}
                    >
                      <motion.div 
                        animate={{ x: config.showFPS ? 20 : 4 }}
                        className={`absolute top-1 w-3 h-3 rounded-full ${config.showFPS ? 'bg-blue-400' : 'bg-white/20'}`} 
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/40 uppercase">Retro Scanlines</span>
                    <div 
                       onClick={() => setConfig({ ...config, scanlines: !config.scanlines })}
                       className={`w-10 h-5 border transition-colors rounded-full relative cursor-pointer ${config.scanlines ? 'bg-blue-500/20 border-blue-500/50' : 'bg-white/5 border-white/10'}`}
                    >
                      <motion.div 
                        animate={{ x: config.scanlines ? 20 : 4 }}
                        className={`absolute top-1 w-3 h-3 rounded-full ${config.scanlines ? 'bg-blue-400' : 'bg-white/20'}`} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance / RAM */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4">
                <h3 className="text-blue-300 font-bold uppercase tracking-widest text-[10px] sm:text-xs">Memory Allocation</h3>
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-white/40 uppercase">WASM Heap Size</span>
                    <div className="flex gap-2">
                      {["512MB", "1GB", "2GB"].map(ram => (
                        <button 
                          key={ram} 
                          onClick={() => setConfig({ ...config, ramAllocation: ram })}
                          className={`flex-1 py-2 rounded-lg border text-[10px] uppercase font-bold transition-all ${config.ramAllocation === ram ? 'bg-blue-500/20 border-blue-400 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}
                        >
                          {ram}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-500/5 rounded-xl">
                     <Cpu className="w-4 h-4 text-blue-400" />
                     <span className="text-[10px] text-white/60 font-mono uppercase tracking-tighter">Dual-Core (MTGS) Enabled</span>
                  </div>
                </div>
              </div>

              {/* Input Settings */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4">
                <h3 className="text-blue-300 font-bold uppercase tracking-widest text-[10px] sm:text-xs">Controller Setup</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer" onClick={() => setConfig({ ...config, virtualControls: !config.virtualControls })}>
                    <div className="flex items-center gap-3">
                      <Cpu className="w-4 h-4 text-blue-400" />
                      <span className="text-[10px] text-white font-bold uppercase">Virtual Controls</span>
                    </div>
                    <div className={`w-9 h-5 rounded-full relative transition-colors ${config.virtualControls ? 'bg-blue-600' : 'bg-zinc-700'}`}>
                      <motion.div 
                        animate={{ x: config.virtualControls ? 18 : 2 }}
                        className="absolute top-[2px] w-4 h-4 bg-white rounded-full shadow-sm" 
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-white/40 uppercase">Overlay Opacity ({config.overlayOpacity}%)</span>
                    <input 
                      type="range" 
                      className="w-full accent-blue-500 opacity-70 cursor-pointer" 
                      min="10" 
                      max="100" 
                      value={config.overlayOpacity}
                      onChange={(e) => setConfig({ ...config, overlayOpacity: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
              
              {/* Controller Mapping */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4 md:col-span-2 lg:col-span-3">
                <h3 className="text-blue-300 font-bold uppercase tracking-widest text-[10px] sm:text-xs flex items-center justify-between">
                  Button Mapping
                  <span className="text-[9px] text-white/20 normal-case font-normal italic">
                    {activeMappingKey ? `Press a key for ${activeMappingKey}...` : "Click a button to remap"}
                  </span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {Object.entries(config.keyMapping).map(([btn, key]) => (
                    <button
                      key={btn}
                      onClick={() => setActiveMappingKey(btn as string)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${activeMappingKey === btn ? 'bg-blue-500/40 border-blue-400 scale-105' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                    >
                      <span className="text-[9px] text-blue-400 font-bold uppercase">{btn}</span>
                      <span className="text-xs text-white font-mono">{key === " " ? "Space" : key as string}</span>
                    </button>
                  ))}
                </div>
                
                <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center gap-6">
                  <div className="flex flex-col gap-2 w-full sm:w-1/3">
                    <span className="text-[10px] text-white/40 uppercase">Virtual Controller Size</span>
                    <div className="flex gap-2">
                       {["sm", "md", "lg"].map(size => (
                        <button 
                          key={size} 
                          onClick={() => setConfig({ ...config, vControllerSize: size })}
                          className={`flex-1 py-1.5 rounded-lg border text-[9px] uppercase font-bold transition-all ${config.vControllerSize === size ? 'bg-blue-500/20 border-blue-400 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[9px] text-white/20 uppercase max-w-sm">
                    Configure your physical keyboard layout or adjust the on-screen overlay dimensions for the optimal mobile gameplay experience.
                  </p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setScreen("main")}
              className="mt-6 px-10 py-3 border border-white/20 text-white/70 hover:bg-white/10 rounded-full transition-all uppercase text-[10px] font-bold tracking-[0.2em]"
            >
              Back to Menu
            </button>
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

            <div className="mt-8 text-white/20 font-mono text-[9px] sm:text-[10px] flex flex-wrap justify-center gap-4 sm:gap-8 px-4">
              {config.showFPS && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                  <span>FPS: 59.9 / 60.0 (NTSC)</span>
                </div>
              )}
              <span>GS: {config.resolution} • OpenGL</span>
              <span>MEMORY: 32MB Main / {config.ramAllocation} WASM</span>
              <span>INPUT: Keyboard & {config.virtualControls ? 'Virtual' : 'Manual'} Enabled</span>
            </div>

            {/* Mobile/Tablet Virtual Overlay */}
            {config.virtualControls && (
              <div style={{ opacity: config.overlayOpacity / 100 }}>
                <PS2VirtualController size={config.vControllerSize} />
              </div>
            )}
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
