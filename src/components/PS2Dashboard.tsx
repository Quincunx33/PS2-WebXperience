import { motion, AnimatePresence } from "motion/react";
import React, { useState, useEffect } from "react";
import { Settings, Disc, Box, ChevronRight, Info, AlertTriangle, Database, HardDrive, Trash2, Cpu, GripVertical, Play } from "lucide-react";
import PS2Clock from "./PS2Clock";
import { StorageService, StoredGame } from "../services/storageService";
import PS2VirtualController from "./PS2VirtualController";
import { soundService } from "../services/soundService";

type Screen = "main" | "storage" | "config" | "emulator" | "running" | "customizer";

type GameMetadata = Omit<StoredGame, 'data'>;

export interface ControllerProfile {
  id: string;
  name: string;
  vPositions: typeof DEFAULT_V_POSITIONS;
  keyMapping: Record<string, string>;
  overlayOpacity: number;
  vControllerSize: string;
  virtualControls: boolean;
}

const DEFAULT_V_POSITIONS = {
  // Shoulder Left (Grouped Top Left)
  L1: { x: 0, y: 0, scale: 1, opacity: 0.6 },
  L2: { x: 0, y: 50, scale: 1, opacity: 0.6 },
  // Shoulder Right (Grouped Top Right)
  R1: { x: 0, y: 0, scale: 1, opacity: 0.6 },
  R2: { x: 0, y: 50, scale: 1, opacity: 0.6 },
  
  // D-Pad (Top Left, Cross shape)
  UP: { x: 60, y: -120, scale: 1, opacity: 0.6 },
  LEFT: { x: 0, y: -60, scale: 1, opacity: 0.6 },
  RIGHT: { x: 120, y: -60, scale: 1, opacity: 0.6 },
  DOWN: { x: 60, y: 0, scale: 1, opacity: 0.6 },
  
  // Left Analog (Below D-Pad, towards center)
  ANALOG_L: { x: 120, y: 10, scale: 1, opacity: 0.4 },
  L3: { x: 120, y: 10, scale: 0.8, opacity: 0.2 },

  // Face Buttons (Top Right, Diamond shape)
  TRIANGLE: { x: -60, y: -120, scale: 1, opacity: 0.6 },
  SQUARE: { x: -120, y: -60, scale: 1, opacity: 0.6 },
  CIRCLE: { x: 0, y: -60, scale: 1, opacity: 0.6 },
  CROSS: { x: -60, y: 0, scale: 1, opacity: 0.6 },
  
  // Right Analog (Below Face Buttons, towards center)
  ANALOG_R: { x: -120, y: 10, scale: 1, opacity: 0.4 },
  R3: { x: -120, y: 10, scale: 0.8, opacity: 0.2 },

  // Center Area
  SELECT: { x: -40, y: -20, scale: 1, opacity: 0.6 },
  START: { x: 40, y: -20, scale: 1, opacity: 0.6 },
};

export default function PS2Dashboard() {
  const [screen, setScreen] = useState<Screen>("main");
  
  const handleSetScreen = (newScreen: Screen) => {
    if (newScreen !== screen) {
      soundService.playWhoosh();
      setScreen(newScreen);
    }
  };

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [selectedGame, setSelectedGame] = useState<GameMetadata | null>(null);
  const [showError, setShowError] = useState(false);
  const [isEmulatorLoading, setIsEmulatorLoading] = useState(false);
  const [storedGames, setStoredGames] = useState<GameMetadata[]>([]);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [showInGameSettings, setShowInGameSettings] = useState(false);

  // Integrity Check State
  const [integrity, setIntegrity] = useState({
    wasm: 'pending',
    js: 'pending',
    webgl: 'pending',
    threads: 'pending'
  });

  const runIntegrityCheck = async () => {
    setIntegrity({ wasm: 'checking', js: 'checking', webgl: 'checking', threads: 'checking' });
    
    // Artificial small delay for "Real" feeling
    await new Promise(r => setTimeout(r, 800));

    const wasmReady = typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';
    const webglReady = !!window.WebGL2RenderingContext;
    const threadsReady = !!window.SharedArrayBuffer;
    const jsReady = typeof window.requestAnimationFrame === 'function';

    setIntegrity({
      wasm: wasmReady ? 'ok' : 'error',
      js: jsReady ? 'ok' : 'error',
      webgl: webglReady ? 'ok' : 'error',
      threads: threadsReady ? 'ok' : 'warn'
    });
  };

  useEffect(() => {
    if (screen === 'emulator') {
      runIntegrityCheck();
    }
  }, [screen]);

  // System Configuration State
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem("ps2_config");
    const baseConfig = {
      resolution: "1080p",
      showFPS: true,
      fpsTarget: 60,
      scanlines: false,
      ramAllocation: "2GB",
      virtualControls: true,
      overlayOpacity: 60,
      vControllerSize: "md",
      editLayoutMode: false,
      vPositions: DEFAULT_V_POSITIONS,
      keyMapping: {
        CROSS: "k", CIRCLE: "l", SQUARE: "j", TRIANGLE: "i",
        L1: "q", R1: "e", L2: "1", R2: "3",
        UP: "w", DOWN: "s", LEFT: "a", RIGHT: "d",
        START: "Enter", SELECT: "Shift"
      },
      profiles: [] as ControllerProfile[],
      activeProfileId: "default"
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...baseConfig, ...parsed };
      } catch (e) {
        return baseConfig;
      }
    }
    return baseConfig;
  });

  useEffect(() => {
    localStorage.setItem("ps2_config", JSON.stringify(config));
  }, [config]);

  const [activeMappingKey, setActiveMappingKey] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [profileNameInput, setProfileNameInput] = useState("");
  const [resetKey, setResetKey] = useState(0);

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
    // Prevent scrolling and handle landscape simulation
    if (screen === "customizer" || screen === "running") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
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
      
      try {
        setIsInstalling(true);
        setInstallProgress(0);
        const gameId = await StorageService.saveGame(file, (p) => setInstallProgress(p));
        const newGame: GameMetadata = {
          id: gameId,
          name: file.name,
          size: file.size,
          type: file.name.split('.').pop()?.toUpperCase() || "ISO",
          date: Date.now(),
          totalChunks: Math.ceil(file.size / (10 * 1024 * 1024))
        };
        setSelectedGame(newGame);
        await refreshStorage();
      } catch (err: any) {
        alert(err.message || "Failed to save game to IndexedDB");
        setSelectedGame(null);
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
    handleSetScreen("running");
  };

  const menuItems = [
    { 
      id: "storage", 
      label: storedGames.length > 0 ? "Saved Games" : "Disc Browser", 
      icon: <Disc className="w-8 h-8" />,
      desc: `${storedGames.length} Disks Mounted`
    },
    { 
      id: "config", 
      label: "System Configuration", 
      icon: <Settings className="w-8 h-8" />,
      desc: `${config.resolution} • ${config.ramAllocation} RAM`
    },
    { 
      id: "emulator", 
      label: "Run Game", 
      icon: <Box className="w-8 h-8" />,
      desc: "Boot a PS2 ISO file"
    },
    { 
      id: "info", 
      label: "System Info", 
      icon: <Info className="w-8 h-8" />,
      desc: "v2.4.0 Engine"
    }
  ];

  // FPS Counter Logic
  const [fps, setFps] = useState(0);
  const [activeButtons, setActiveButtons] = useState<string[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      const keyMapEntry = Object.entries(config.keyMapping).find(([_, key]) => key === e.key);
      if (keyMapEntry) {
        setActiveButtons(prev => prev.includes(keyMapEntry[0]) ? prev : [...prev, keyMapEntry[0]]);
        // Here you would proxy to play.js via Emscripten if running
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      const keyMapEntry = Object.entries(config.keyMapping).find(([_, key]) => key === e.key);
      if (keyMapEntry) {
        setActiveButtons(prev => prev.filter(b => b !== keyMapEntry[0]));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [config.keyMapping]);
  useEffect(() => {
    if (!config.showFPS) return;
    
    let frameCount = 0;
    let lastTime = performance.now();
    let lastUpdate = performance.now();
    let rafId: number;

    const frameInterval = 1000 / config.fpsTarget;

    const update = (currentTime: number) => {
      const elapsedSinceLastFrame = currentTime - lastTime;
      
      if (elapsedSinceLastFrame >= frameInterval) {
        frameCount++;
        lastTime = currentTime - (elapsedSinceLastFrame % frameInterval);
        
        if (currentTime - lastUpdate >= 1000) {
          // Add a tiny bit of "realism" fluctuation if at target
          const jitter = (Math.random() - 0.5) * 2;
          setFps(Math.round(frameCount + jitter));
          frameCount = 0;
          lastUpdate = currentTime;
        }
      }
      
      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, [config.showFPS, config.fpsTarget]);

  // Resolution Scaling Effect
  useEffect(() => {
    const root = document.documentElement;
    if (config.resolution === "4K") {
      root.style.setProperty('--app-scale', '1.1');
      root.style.filter = 'contrast(1.1) saturate(1.1) brightness(1.05)';
    } else if (config.resolution === "1440p") {
      root.style.setProperty('--app-scale', '1.05');
      root.style.filter = 'contrast(1.05) brightness(1.02)';
    } else {
      root.style.setProperty('--app-scale', '1');
      root.style.filter = 'none';
    }
  }, [config.resolution]);

  const renderScreen = () => {
    const renderPortraitGuard = () => (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[999] bg-zinc-950 flex flex-col items-center justify-center p-8 text-center sm:hidden portrait:flex hidden"
      >
        <div className="w-24 h-24 border-2 border-white/10 rounded-3xl flex items-center justify-center mb-8 bg-zinc-900 shadow-2xl">
          <motion.div 
            animate={{ rotate: 90 }} 
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, ease: "easeInOut" }}
            className="w-14 h-7 border-2 border-blue-500 rounded-lg relative"
          >
            <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-1 h-2 bg-blue-500 rounded-r-sm" />
          </motion.div>
        </div>
        <h3 className="text-white font-bold uppercase tracking-[0.3em] text-sm mb-3">Rotation Required</h3>
        <p className="text-white/40 text-[10px] uppercase tracking-widest leading-relaxed max-w-[200px]">
          Please rotate your device to landscape for the best gaming experience.
        </p>
      </motion.div>
    );

    switch (screen) {
      case "customizer":
        return (
          <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center overflow-hidden touch-none">
            {renderPortraitGuard()}

            {/* Background Grid */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
               <div className="grid grid-cols-12 grid-rows-12 h-full w-full">
                  {Array.from({ length: 144 }).map((_, i) => <div key={i} className="border-[0.5px] border-white/20" />)}
               </div>
            </div>

            <PS2VirtualController 
               isEditing={true}
              positions={config.vPositions}
              selectedKey={selectedKey}
              onSelect={setSelectedKey}
              onResetAll={() => {
                if (confirm("Reset ALL button positions and sizes to default?")) {
                  setConfig(prev => ({ ...prev, vPositions: DEFAULT_V_POSITIONS }));
                  setResetKey(prev => prev + 1);
                }
              }}
              onPositionChange={(key, pos) => setConfig(prev => ({
                ...prev,
                vPositions: { 
                  ...prev.vPositions, 
                  [key]: { ...prev.vPositions[key as any], ...pos } 
                }
              }))}
            />

            {/* Scale/Opacity Panel */}
            <AnimatePresence>
              {selectedKey && (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0, x: 20 }}
                  animate={{ scale: 1, opacity: 1, x: 0 }}
                  exit={{ scale: 0.9, opacity: 0, x: 20 }}
                  className="fixed top-1/2 -translate-y-1/2 right-4 w-[280px] sm:w-[300px] bg-zinc-900 border border-white/20 p-4 rounded-3xl z-[150] backdrop-blur-3xl shadow-2xl flex flex-col gap-4 max-h-[80vh] overflow-y-auto hidden-scrollbar"
                >
                  <div className="flex items-center justify-between mb-3 sm:mb-4 sticky top-0 bg-zinc-900 pt-1 pb-2 z-10 border-b border-white/10">
                    <h3 className="text-blue-400 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] flex items-center gap-2">
                       Editing: <span className="text-white text-xs">{selectedKey}</span>
                    </h3>
                    <button onClick={() => setSelectedKey(null)} className="text-white/40 hover:text-white p-2">✕</button>
                  </div>

                  <div className="flex flex-col gap-4 sm:gap-6">
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex justify-between items-center text-[8px] sm:text-[9px] uppercase font-bold text-white/50">
                        <span>Size / Scale</span>
                        <span className="text-blue-400">{Math.round(config.vPositions[selectedKey as keyof typeof DEFAULT_V_POSITIONS].scale * 100)}%</span>
                      </div>
                      <input 
                        type="range" min="0.4" max="2.5" step="0.1"
                        value={config.vPositions[selectedKey as keyof typeof DEFAULT_V_POSITIONS].scale}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          vPositions: {
                            ...prev.vPositions,
                            [selectedKey]: { ...prev.vPositions[selectedKey as keyof typeof DEFAULT_V_POSITIONS], scale: parseFloat(e.target.value) }
                          }
                        }))}
                        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>

                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex justify-between items-center text-[8px] sm:text-[9px] uppercase font-bold text-white/50">
                        <span>Visibility</span>
                        <span className="text-blue-400">{Math.round(config.vPositions[selectedKey as keyof typeof DEFAULT_V_POSITIONS].opacity * 100)}%</span>
                      </div>
                      <input 
                        type="range" min="0.05" max="1" step="0.05"
                        value={config.vPositions[selectedKey as keyof typeof DEFAULT_V_POSITIONS].opacity}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          vPositions: {
                            ...prev.vPositions,
                            [selectedKey]: { ...prev.vPositions[selectedKey as keyof typeof DEFAULT_V_POSITIONS], opacity: parseFloat(e.target.value) }
                          }
                        }))}
                        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button 
                        onClick={() => setConfig(prev => ({
                          ...prev,
                          vPositions: {
                            ...prev.vPositions,
                            [selectedKey]: DEFAULT_V_POSITIONS[selectedKey as keyof typeof DEFAULT_V_POSITIONS]
                          }
                        }))}
                        className="flex-1 py-2 sm:py-3 px-3 sm:px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[8px] sm:text-[9px] uppercase font-bold text-white transition-all active:scale-95"
                      >
                        Reset
                      </button>
                      <button 
                        onClick={() => setSelectedKey(null)}
                        className="flex-1 py-2 sm:py-3 px-3 sm:px-4 bg-blue-600 border border-blue-500 rounded-xl text-[8px] sm:text-[9px] uppercase font-bold text-white transition-all active:scale-95 sm:hidden"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom-right layout text removed for cleaner UI */}
            
            {/* Save Button (Top Right) */}
            <div className={`fixed top-2 right-2 z-[110] transition-all ${selectedKey ? 'opacity-0 pointer-events-none' : ''}`}>
              <button 
                onClick={() => { soundService.playCancel(); handleSetScreen("main"); }}
                className="px-4 py-2 bg-blue-600/60 border border-blue-500/30 text-white/90 rounded-md text-[8px] sm:text-[10px] uppercase font-bold tracking-widest active:scale-95 backdrop-blur-sm shadow-xl"
              >
                Save
              </button>
            </div>
            
            {/* Reset Button (Top Left) */}
            <div className={`fixed top-2 left-2 z-[110] transition-all ${selectedKey ? 'opacity-0 pointer-events-none' : ''}`}>
              <button 
                onClick={() => {
                  if (confirm("Reset ALL button positions and sizes to default?")) {
                    setConfig(prev => ({ ...prev, vPositions: DEFAULT_V_POSITIONS }));
                    setResetKey(prev => prev + 1);
                  }
                }}
                className="px-4 py-2 bg-red-600/60 border border-red-500/30 text-white/90 rounded-md text-[8px] sm:text-[10px] uppercase font-bold tracking-widest active:scale-95 backdrop-blur-sm shadow-xl"
              >
                Reset
              </button>
            </div>

            {/* Bottom Safe Area Sync */}
            {!selectedKey && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 text-[9px] text-white/20 uppercase tracking-[0.3em] font-bold pointer-events-none text-center">
                Landscape Mode Sync: <span className="text-blue-500/50">Active</span>
              </div>
            )}
          </div>
        );

      case "main":
        return (
          <div className="flex flex-col items-center justify-center gap-8 sm:gap-16 px-4">
            <PS2Clock />
            
            <div className="flex flex-col gap-2 w-full max-w-[280px] sm:max-w-[400px]">
              {menuItems.map((item, idx) => (
                <motion.button
                  key={item.id}
                  onClick={() => {
                    soundService.playSelect();
                    handleSetScreen(item.id as Screen);
                  }}
                  onMouseEnter={() => {
                    soundService.playHover();
                    setSelectedIdx(idx);
                  }}
                  className={`
                    flex items-center justify-between p-3 sm:p-4 rounded-xl transition-all duration-300
                    ${selectedIdx === idx ? 'bg-white/20 border-l-4 border-blue-400 shadow-lg shadow-blue-500/10' : 'bg-white/5 border-l-4 border-transparent'}
                  `}
                  whileHover={{ x: 10 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                    <span className="text-blue-300 flex-shrink-0">
                      {React.cloneElement(item.icon as React.ReactElement, { className: "w-5 h-5 sm:w-8 sm:h-8" })}
                    </span>
                    <div className="flex flex-col items-start overflow-hidden text-left">
                      <span className="text-white font-bold tracking-widest uppercase text-[11px] sm:text-sm truncate w-full">
                        {item.label}
                      </span>
                      <span className="text-gray-400 text-[8px] sm:text-[10px] uppercase tracking-tighter truncate w-full">
                        {item.desc}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0 ${selectedIdx === idx ? 'opacity-100' : 'opacity-0'}`} />
                </motion.button>
              ))}
            </div>

            <div className="text-white/20 text-[9px] sm:text-xs flex items-center gap-2 uppercase tracking-widest mt-4">
              <Info className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Use mouse or keyboard to navigate</span>
              <span className="sm:hidden">Touch to navigate</span>
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
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetScreen("config");
                            }}
                            className="p-2 lg:opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded transition-all flex-shrink-0"
                            title="Configure Game"
                          >
                            <Settings className="w-3 h-3 text-white/70" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedGame(game);
                              soundService.playConfirm();
                              handleRunGame();
                            }}
                            className="p-2 lg:opacity-0 group-hover:opacity-100 hover:bg-green-500/20 rounded transition-all flex-shrink-0"
                            title="Run Game"
                          >
                            <Play className="w-3 h-3 text-green-400" />
                          </button>
                          <button 
                            onClick={(e) => deleteGame(game.id, e)}
                            className="p-2 lg:opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded transition-all flex-shrink-0"
                            title="Delete Game"
                          >
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <button 
              onClick={() => { soundService.playCancel(); handleSetScreen("main"); }}
              className="mt-6 px-10 py-3 border border-white/20 text-white/70 hover:bg-white/10 rounded-full transition-all uppercase text-[10px] font-bold tracking-[0.2em]"
            >
              Back to Menu
            </button>
          </div>
        );

      case "emulator":
        return (
          <div className="max-w-[calc(100vw-2rem)] sm:max-w-4xl w-full bg-black/80 border border-blue-500/30 p-4 sm:p-10 rounded-3xl backdrop-blur-2xl flex flex-col items-center gap-6 sm:gap-8 shadow-[0_0_100px_rgba(59,130,246,0.15)] relative mx-auto my-4 overflow-hidden">
            
            {/* Limitation Modal/Overlay */}
            <AnimatePresence>
              {(showError || integrity.wasm === 'error') && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute inset-0 z-50 bg-zinc-950/95 flex flex-col items-center justify-center p-8 text-center"
                >
                  <AlertTriangle className="w-16 h-16 text-red-500 mb-6 animate-pulse" />
                  <h3 className="text-xl font-bold tracking-widest uppercase text-white mb-4">Environment Error</h3>
                  <p className="text-red-300 font-mono text-sm leading-relaxed max-w-lg mb-8">
                    {integrity.wasm === 'error' 
                      ? "CRITICAL: WebAssembly is disabled or not supported in this browser. The Emotion Engine cannot be virtualized."
                      : "FATAL ERROR: Emotion Engine architecture cannot be natively executed within this WebAssembly context."}
                  </p>
                  <button 
                    onClick={() => { setShowError(false); setScreen('main'); }}
                    className="px-10 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold uppercase tracking-widest text-xs transition-colors border border-white/10"
                  >
                    Return to Dashboard
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex flex-col items-center sm:items-start gap-2">
                <div className="flex items-center gap-3">
                  <Cpu className="w-6 h-6 text-blue-400" />
                  <h2 className="text-white text-2xl font-bold tracking-[0.2em] uppercase">Emu-Core Engine</h2>
                </div>
                <div className="h-[1px] w-32 bg-gradient-to-r from-blue-500/50 to-transparent" />
                <p className="text-white/30 text-[9px] uppercase tracking-[0.3em]">Version 2.4.5-Stable (WASM-JS)</p>
              </div>

              <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                 <div className="flex flex-col items-end">
                    <span className="text-[8px] text-white/40 uppercase">Engine Status</span>
                    <span className={`text-[10px] font-bold uppercase ${integrity.wasm === 'ok' ? 'text-green-500' : 'text-yellow-500 animate-pulse'}`}>
                      {integrity.wasm === 'ok' ? 'READY' : 'DIAGNOSING...'}
                    </span>
                 </div>
                 <div className={`w-2 h-2 rounded-full ${integrity.wasm === 'ok' ? 'bg-green-500' : 'bg-yellow-500'} shadow-[0_0_8px_currentColor]`} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {/* Integrity Table */}
              <div className="bg-white/5 p-5 rounded-2xl border border-white/10 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-blue-300 font-bold uppercase tracking-widest text-[10px]">System Check</h3>
                  <button 
                    onClick={runIntegrityCheck}
                    className="text-[8px] text-white/30 hover:text-white uppercase transition-colors"
                  >
                    Re-scan
                  </button>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'WebAssembly (WASM)', status: integrity.wasm },
                    { label: 'JavaScript JIT Engine', status: integrity.js },
                    { label: 'WebGL 2.0 Acceleration', status: integrity.webgl },
                    { label: 'SharedArrayBuffer (Threads)', status: integrity.threads },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/5">
                      <span className="text-[9px] text-white/60 uppercase">{item.label}</span>
                      {item.status === 'ok' ? (
                        <span className="text-[9px] text-green-500 font-bold">PASS</span>
                      ) : item.status === 'warn' ? (
                        <span className="text-[9px] text-yellow-500 font-bold">WARN</span>
                      ) : item.status === 'error' ? (
                        <span className="text-[9px] text-red-500 font-bold">FAIL</span>
                      ) : (
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity }} className="w-10 h-1 bg-white/20 rounded-full overflow-hidden" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Loader Configuration */}
              <div className="bg-white/5 p-5 rounded-2xl border border-white/10 space-y-4 flex flex-col justify-center">
                <h3 className="text-blue-300 font-bold uppercase tracking-widest text-[10px]">Boot Strategy</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                      <Database className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-white font-bold uppercase">Dynamic JIT</span>
                      <span className="text-[8px] text-white/40 uppercase">Fastest available mode</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center border border-green-500/30">
                      <Settings className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-white font-bold uppercase">Auto-Flush VRAM</span>
                      <span className="text-[8px] text-white/40 uppercase">Optimized for low-end GPU</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="w-full space-y-4">
               <label className={`w-full h-32 sm:h-48 border-2 border-dashed ${selectedGame ? 'border-green-500/40 bg-green-500/5' : 'border-blue-500/20'} rounded-2xl flex flex-col items-center justify-center gap-4 hover:bg-blue-500/10 cursor-pointer transition-all relative overflow-hidden group`}>
                <input type="file" className="hidden" accept=".iso,.elf,.bin" onChange={handleFileChange} disabled={isInstalling} />
                
                {isInstalling ? (
                  <div className="flex flex-col items-center gap-4 w-full px-12 z-10">
                    <div className="flex justify-between w-full mb-1">
                      <span className="text-[10px] text-blue-400 font-bold uppercase">Writing to VFS</span>
                      <span className="text-[10px] text-blue-400 font-bold">{installProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-blue-900/50 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-blue-400 shadow-[0_0_10px_#60a5fa]"
                        initial={{ width: 0 }}
                        animate={{ width: `${installProgress}%` }}
                      />
                    </div>
                    <span className="text-white/30 text-[8px] uppercase tracking-widest animate-pulse">
                      Do not refresh browser
                    </span>
                  </div>
                ) : selectedGame ? (
                  <div className="text-center px-4 animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                       <Play className="w-6 h-6 text-green-400 fill-green-400/20" />
                    </div>
                    <span className="text-green-300 font-bold uppercase tracking-[0.2em] block text-xs mb-1">Disc Authenticated</span>
                    <span className="text-white/40 text-[9px] uppercase truncate max-w-[200px] block mx-auto">{selectedGame?.name}</span>
                  </div>
                ) : (
                  <>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-b from-blue-500 to-transparent pointer-events-none" />
                    <Disc className="w-12 h-12 text-blue-500/30 group-hover:text-blue-400 group-hover:scale-110 transition-all duration-500" />
                    <div className="text-center px-4">
                      <span className="text-white font-bold uppercase tracking-[0.3em] block text-xs sm:text-sm">Mount Game Disc</span>
                      <span className="text-white/30 text-[9px] uppercase tracking-widest mt-2 block">Accepts ISO / ELF / BIN</span>
                    </div>
                  </>
                )}
              </label>
            </div>

            <div className="flex gap-4 w-full">
              <button 
                onClick={() => { soundService.playCancel(); handleSetScreen("main"); }}
                className="flex-1 py-4 border border-white/10 text-white/40 hover:bg-white/5 hover:text-white rounded-2xl transition-all uppercase text-[10px] font-bold tracking-[0.3em]"
              >
                Cancel
              </button>
              <button 
                onClick={handleRunGame}
                disabled={!selectedGame || integrity.wasm !== 'ok'}
                className={`flex-1 py-4 rounded-2xl transition-all uppercase text-[10px] font-bold tracking-[0.3em] flex items-center justify-center gap-3 ${
                  selectedGame && integrity.wasm === 'ok'
                    ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-2xl shadow-blue-500/40 border-t border-white/20' 
                    : 'bg-white/5 border border-white/5 text-white/10 cursor-not-allowed'
                }`}
              >
                {selectedGame && integrity.wasm === 'ok' && <Play className="w-3 h-3 fill-current" />}
                {integrity.wasm === 'checking' ? 'Validating...' : 'Initiate Boot'}
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
                <h3 className="text-blue-300 font-bold uppercase tracking-widest text-[10px] sm:text-xs">Video Engine</h3>
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-white/40 uppercase">Internal Resolution</span>
                    <select 
                      value={config.resolution}
                      onChange={(e) => setConfig({ ...config, resolution: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white"
                    >
                      <option value="480p">480p (Native)</option>
                      <option value="720p">720p (HD)</option>
                      <option value="1080p">1080p (FHD)</option>
                      <option value="1440p">2K (QHD)</option>
                      <option value="4K">4K (UHD)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-white/40 uppercase">Frame Rate Target</span>
                    <select 
                      value={config.fpsTarget}
                      onChange={(e) => setConfig({ ...config, fpsTarget: parseInt(e.target.value) })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white"
                    >
                      <option value={30}>30 FPS (Stability)</option>
                      <option value={60}>60 FPS (Performance)</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/40 uppercase">OSD Monitor</span>
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
                          onClick={() => { soundService.playHover(); setConfig({ ...config, ramAllocation: ram }); }}
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
                  <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer" onClick={() => { soundService.playHover(); setConfig({ ...config, virtualControls: !config.virtualControls }); }}>
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
                  
                  <button 
                    onClick={() => {
                      soundService.playSelect();
                      handleSetScreen("customizer");
                    }}
                    className="w-full py-3 rounded-xl border flex items-center justify-center gap-2 transition-all font-bold text-[10px] uppercase tracking-widest bg-white/5 border-white/10 text-blue-400 hover:bg-white/10 active:scale-95"
                  >
                    <GripVertical className="w-4 h-4" />
                    Open Advanced Layout Editor
                  </button>

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
                  
                  <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
                    <span className="text-[10px] text-white/40 uppercase">Save Controller Profile</span>
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         value={profileNameInput} 
                         onChange={e => setProfileNameInput(e.target.value)}
                         placeholder="Profile name..."
                         className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                       />
                       <button
                         onClick={() => {
                           if (!profileNameInput.trim()) return;
                           const newProfile: ControllerProfile = {
                             id: Date.now().toString(),
                             name: profileNameInput.trim(),
                             vPositions: config.vPositions,
                             keyMapping: config.keyMapping,
                             overlayOpacity: config.overlayOpacity,
                             vControllerSize: config.vControllerSize,
                             virtualControls: config.virtualControls
                           };
                           setConfig({
                             ...config,
                             profiles: [...(config.profiles || []), newProfile],
                             activeProfileId: newProfile.id
                           });
                           setProfileNameInput("");
                         }}
                         className="px-4 py-2 bg-blue-500/20 text-blue-300 font-bold uppercase text-[9px] rounded-lg hover:bg-blue-500/40 transition-colors"
                       >
                         Save
                       </button>
                    </div>
                  </div>

                  {(config.profiles && config.profiles.length > 0) && (
                    <div className="flex flex-col gap-2 pt-2">
                      <span className="text-[10px] text-white/40 uppercase">Active Profile</span>
                      <div className="flex gap-2">
                         <select
                           value={config.activeProfileId || "default"}
                           onChange={(e) => {
                             const id = e.target.value;
                             if (id === "default") {
                                setConfig({ 
                                  ...config, 
                                  activeProfileId: "default",
                                  vPositions: DEFAULT_V_POSITIONS,
                                  keyMapping: {
                                    CROSS: "k", CIRCLE: "l", SQUARE: "j", TRIANGLE: "i",
                                    L1: "q", R1: "e", L2: "1", R2: "3",
                                    UP: "w", DOWN: "s", LEFT: "a", RIGHT: "d",
                                    START: "Enter", SELECT: "Shift"
                                  }
                                });
                             } else {
                               const profile = config.profiles.find((p: ControllerProfile) => p.id === id);
                               if (profile) {
                                 setConfig({
                                   ...config,
                                   activeProfileId: id,
                                   vPositions: profile.vPositions,
                                   keyMapping: profile.keyMapping,
                                   overlayOpacity: profile.overlayOpacity,
                                   vControllerSize: profile.vControllerSize,
                                   virtualControls: profile.virtualControls,
                                 });
                               }
                             }
                           }}
                           className="flex-1 bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                         >
                           <option value="default">Default</option>
                           {config.profiles.map((p: ControllerProfile) => (
                             <option key={p.id} value={p.id}>{p.name}</option>
                           ))}
                         </select>
                         <button
                            onClick={() => {
                              if (confirm("Delete this controller profile?")) {
                                setConfig({
                                  ...config,
                                  profiles: config.profiles.filter((p: ControllerProfile) => p.id !== config.activeProfileId),
                                  activeProfileId: "default",
                                  vPositions: DEFAULT_V_POSITIONS,
                                  keyMapping: {
                                    CROSS: "k", CIRCLE: "l", SQUARE: "j", TRIANGLE: "i",
                                    L1: "q", R1: "e", L2: "1", R2: "3",
                                    UP: "w", DOWN: "s", LEFT: "a", RIGHT: "d",
                                    START: "Enter", SELECT: "Shift"
                                  }
                                });
                              }
                            }}
                            disabled={!config.activeProfileId || config.activeProfileId === "default"}
                            className="px-3 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/40 disabled:opacity-20 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                         >
                            <Trash2 className="w-3 h-3" />
                         </button>
                      </div>
                    </div>
                  )}

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
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                  {Object.entries(config.keyMapping).map(([btn, key]) => (
                    <button
                      key={btn}
                      onClick={() => setActiveMappingKey(btn as string)}
                      className={`flex flex-col items-center gap-1 p-2 sm:p-3 rounded-xl border transition-all ${activeMappingKey === btn ? 'bg-blue-500/40 border-blue-400 scale-105' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                    >
                      <span className="text-[8px] sm:text-[9px] text-blue-400 font-bold uppercase">{btn}</span>
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
              onClick={() => {
                soundService.playCancel();
                handleSetScreen("main");
                setConfig(prev => ({ ...prev, editLayoutMode: false }));
              }}
              className="mt-6 px-10 py-3 border border-white/20 text-white/70 hover:bg-white/10 rounded-full transition-all uppercase text-[10px] font-bold tracking-[0.2em]"
            >
              Back to Menu
            </button>

            {/* Layout Editor Preview */}
            {config.editLayoutMode && (
              <PS2VirtualController 
                isEditing={true}
                positions={config.vPositions}
                onResetAll={() => {
                  if (confirm("Reset ALL button positions and sizes to default?")) {
                    setConfig(prev => ({ ...prev, vPositions: DEFAULT_V_POSITIONS }));
                  }
                }}
                onPositionChange={(key, pos) => setConfig(prev => ({
                  ...prev,
                  vPositions: { 
                    ...prev.vPositions, 
                    [key]: { ...prev.vPositions[key as any], ...pos } 
                  }
                }))}
              />
            )}
          </div>
        );

      case "running":
        return (
          <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center overflow-hidden touch-none font-sans">
            {renderPortraitGuard()}
            
            {/* Simulation of Game Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <canvas 
                id="canvas" 
                className="w-full h-full object-contain shadow-2xl"
                onContextMenu={(e) => e.preventDefault()}
              />
              
              {!isEmulatorLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 gap-8 z-10 px-6 text-center">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-6"
                  >
                    <div className="relative">
                      <div className="w-24 h-24 border-4 border-blue-500/20 rounded-full flex items-center justify-center">
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                          className="w-20 h-20 border-t-4 border-blue-400 rounded-full"
                        />
                      </div>
                      <Disc className="absolute inset-0 m-auto w-8 h-8 text-blue-400 animate-pulse" />
                    </div>
                    
                    <div className="space-y-2">
                       <span className="text-white font-bold tracking-[0.4em] text-sm uppercase block">Mounting Virtual Disc</span>
                       <span className="text-white/20 text-[9px] uppercase tracking-widest block max-w-[200px] truncate mx-auto">{selectedGame?.name}</span>
                    </div>
                    <button 
                      onClick={async () => {
                        if (!selectedGame) return;
                        setIsEmulatorLoading(true);
                      
                      // Fetch the game blob
                      let gameBlob: Blob;
                      try {
                        gameBlob = await StorageService.getFullFile(selectedGame.id);
                      } catch (err) {
                        console.error("Failed to fetch game data:", err);
                        alert("Failed to load game data from storage");
                        setIsEmulatorLoading(false);
                        return;
                      }

                      // Inject Emscripten Module Config
                      const ramMB = config.ramAllocation === "2GB" ? 2048 : (config.ramAllocation === "1GB" ? 1024 : 512);
                      
                      const canvasElem = document.getElementById('canvas') as HTMLCanvasElement;
                      
                      const scaleFactor = config.resolution.includes("2x") ? 2 : (config.resolution.includes("3x") ? 3 : 1);
                      canvasElem.width = 640 * scaleFactor;
                      canvasElem.height = 448 * scaleFactor;
                      canvasElem.style.imageRendering = scaleFactor === 1 ? 'pixelated' : 'auto';

                      canvasElem.oncontextmenu = (e) => e.preventDefault();
                      canvasElem.tabIndex = -1;
                      canvasElem.focus();

                      (window as any).Module = {
                        canvas: canvasElem,
                        TOTAL_MEMORY: ramMB * 1024 * 1024,
                        ALLOW_MEMORY_GROWTH: true,
                        
                        arguments: ['-cdrom', `/games/${selectedGame.name}`],
                        
                        locateFile: (path: string, prefix: string) => {
                          if (path.endsWith('.wasm')) return '/play.wasm';
                          return prefix + path;
                        },

                        webglContextAttributes: {
                          antialias: false,
                          alpha: false,
                          preserveDrawingBuffer: false,
                          powerPreference: 'high-performance',
                          depth: true,
                          stencil: true
                        },

                        ENV: {
                          SDL_AUDIO_SAMPLES: '2048',
                          SDL_AUDIO_CHANNELS: '2',
                          SDL_AUDIO_FREQ: '44100',
                          SDL_RENDER_VSYNC: '0'
                        },
                        
                        preRun: [() => {
                          console.log(`[Engine] Optimized RAM: ${ramMB}MB initialized`);
                          
                          const FS = (window as any).FS;
                          if (FS) {
                            try {
                              FS.mkdir('/games');
                              // Standard Play! build often works better if games are mounted via WORKERFS or written directly
                              // For simplicity and compatibility with standard Emscripten builds, we write the data if it's not too huge
                              // or better, we use the Blob directly if WORKERFS is available
                              if ((window as any).WORKERFS) {
                                FS.mount((window as any).WORKERFS, {
                                  blobs: [{ name: selectedGame.name, data: gameBlob }]
                                }, '/games');
                                console.log("[Engine] Mounted game via WORKERFS");
                              } else {
                                // Fallback to memory write (caution: memory intensive)
                                gameBlob.arrayBuffer().then(buf => {
                                  FS.writeFile(`/games/${selectedGame.name}`, new Uint8Array(buf));
                                  console.log("[Engine] Wrote game to VFS memory");
                                });
                              }

                              FS.mkdir('/gta_cache');
                              FS.mount((window as any).IDBFS, {}, '/gta_cache');
                              FS.syncfs(true, (err: any) => {
                                if (err) console.warn('[Engine] VFS Cache Sync warn:', err);
                              });
                            } catch(err) {
                              console.error('[Engine] FS Error:', err);
                            }
                          }
                        }],
                        print: (text: string) => console.log('[Play!]', text),
                        printErr: (text: string) => console.error('[Play!]', text),
                        onRuntimeInitialized: () => {
                          console.log("[Engine] Runtime Initialized");
                        }
                      };

                        const script = document.createElement('script');
                        script.src = '/play.js';
                        script.async = true;
                        script.onload = () => console.log("Engine Script Loaded");
                        script.onerror = () => {
                          alert("Fatal: could not load play.js. Please ensure it exists in the public folder.");
                        };
                        document.body.appendChild(script);
                      }}
                      className="mt-4 px-10 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold uppercase tracking-widest text-xs transition-all shadow-xl shadow-blue-500/20 active:scale-95 border-b-2 border-blue-400"
                    >
                      Authenticate & Run
                    </button>
                  </motion.div>
                </div>
              )}

              {/* In-Game HUD & Controls */}
              {isEmulatorLoading && (
                <>
                  <div className="absolute top-4 left-4 flex flex-col gap-1 pointer-events-none z-20">
                    <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                      <div className="w-1 h-1 rounded-full bg-green-500 shadow-[0_0_5px_green] animate-pulse" />
                      <span className="text-[8px] text-white/50 font-mono tracking-wider uppercase">EE Engine: JIT Ready</span>
                    </div>
                    <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 w-fit">
                      <span className="text-[8px] text-white/50 font-mono tracking-wider uppercase">FPS: 60.00</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setShowInGameSettings(true)}
                    className="absolute top-4 right-4 p-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all text-white/30 hover:text-white z-20 active:scale-90"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* In-Game Pause Menu Overlay */}
            <AnimatePresence>
              {showInGameSettings && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[60] bg-zinc-950/80 backdrop-blur-xl flex items-center justify-center p-6"
                >
                  <div className="max-w-xs w-full bg-zinc-900 border border-white/10 rounded-[2.5rem] p-10 space-y-10 shadow-3xl text-center">
                    <div className="space-y-2">
                       <h3 className="text-white text-2xl font-bold uppercase tracking-[0.3em]">System Paused</h3>
                       <div className="h-[1px] w-12 bg-blue-500 mx-auto" />
                    </div>

                    <div className="space-y-3">
                      <button 
                        onClick={() => setShowInGameSettings(false)}
                        className="w-full py-5 bg-white text-black rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95"
                      >
                        Resume Game
                      </button>
                      <button 
                        onClick={() => {
                          setShowInGameSettings(false);
                          setIsEmulatorLoading(false);
                          setScreen("main");
                          soundService.playCancel();
                        }}
                        className="w-full py-5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all border border-red-500/20"
                      >
                        Quit Operation
                      </button>
                    </div>

                    <p className="text-white/20 text-[8px] uppercase tracking-widest pt-4">Storage: VFS-01 ACTIVE</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mobile/Tablet Virtual Overlay */}
            {config.virtualControls && (
              <div style={{ opacity: config.overlayOpacity / 100 }}>
                <PS2VirtualController 
                  isEditing={config.editLayoutMode}
                  positions={config.vPositions}
                  activeButtons={activeButtons}
                  onResetAll={() => {
                    if (confirm("Reset ALL button positions and sizes to default?")) {
                      setConfig(prev => ({ ...prev, vPositions: DEFAULT_V_POSITIONS }));
                    }
                  }}
                  onPositionChange={(key, pos) => setConfig(prev => ({
                    ...prev,
                    vPositions: { 
                      ...prev.vPositions, 
                      [key]: { ...prev.vPositions[key as any], ...pos } 
                    }
                  }))}
                />
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-white">
            Under Construction / কাজ চলছে...
            <button onClick={() => { soundService.playCancel(); handleSetScreen("main"); }} className="block mt-4 text-blue-400 underline">Back</button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start sm:justify-center p-4">
      {config.showFPS && (screen === "customizer" || screen === "running") && (
        <div className="fixed top-0 right-0 z-[1000] font-mono text-[7px] text-green-500/80 bg-black/40 px-1 py-0.5 border-l border-b border-white/5 pointer-events-none select-none cursor-default">
          {fps}
        </div>
      )}
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
