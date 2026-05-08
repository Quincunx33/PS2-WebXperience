import { motion } from "motion/react";
import { Circle, Triangle, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Settings2, X, Square } from "lucide-react";
import React from "react";

interface ButtonConfig {
  x: number;
  y: number;
  scale: number;
  opacity: number;
}

interface ControllerProps {
  isEditing?: boolean;
  positions: Record<string, ButtonConfig>;
  onPositionChange: (key: string, pos: Partial<ButtonConfig>) => void;
  selectedKey?: string | null;
  onSelect?: (key: string | null) => void;
  onResetAll?: () => void;
  activeButtons?: string[];
}

export default function PS2VirtualController({ 
  isEditing = false, 
  positions,
  onPositionChange,
  selectedKey = null,
  onSelect,
  onResetAll,
  activeButtons = []
}: ControllerProps) {
  const [windowWidth, setWindowWidth] = React.useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [draggingKey, setDraggingKey] = React.useState<string | null>(null);
  const hasDraggedRef = React.useRef(false);
  const isMobile = windowWidth < 768;

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderIcon = (key: string) => {
    switch(key) {
      case 'UP': return <ChevronUp className="w-full h-full" />;
      case 'DOWN': return <ChevronDown className="w-full h-full" />;
      case 'LEFT': return <ChevronLeft className="w-full h-full" />;
      case 'RIGHT': return <ChevronRight className="w-full h-full" />;
      case 'TRIANGLE': return <Triangle className="w-full h-full p-2 text-green-400" />;
      case 'CIRCLE': return <Circle className="w-full h-full p-2 text-red-500" />;
      case 'CROSS': return <X className="w-full h-full p-2 text-blue-400" />;
      case 'SQUARE': return <Square className="w-full h-full p-2 text-pink-400" />;
      case 'SELECT': return <span className="text-[10px] font-bold tracking-tighter">SELECT</span>;
      case 'START': return <span className="text-[10px] font-bold tracking-tighter">START</span>;
      case 'L1': return <span className="font-bold">L1</span>;
      case 'L2': return <span className="font-bold">L2</span>;
      case 'L3': return <span className="font-bold text-[10px]">L3</span>;
      case 'R1': return <span className="font-bold">R1</span>;
      case 'R2': return <span className="font-bold">R2</span>;
      case 'R3': return <span className="font-bold text-[10px]">R3</span>;
      case 'ANALOG_L': return <div className="w-full h-full rounded-full bg-white/20 border-4 border-white/10 flex items-center justify-center"><div className="w-1/2 h-1/2 rounded-full bg-white/10" /></div>;
      case 'ANALOG_R': return <div className="w-full h-full rounded-full bg-white/20 border-4 border-white/10 flex items-center justify-center"><div className="w-1/2 h-1/2 rounded-full bg-white/10" /></div>;
      default: return null;
    }
  };

  const getButtonClass = (key: string) => {
    const mobileScale = isMobile ? 'scale-[0.8]' : '';
    const base = `flex items-center justify-center backdrop-blur-md transition-all active:scale-95 shadow-xl border border-white/20 text-white/70 ${mobileScale}`;
    if (key.includes('ANALOG_L') || key.includes('ANALOG_R')) return `${base} w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/5`;
    if (key === 'SELECT' || key === 'START') return `${base} px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/10`;
    if (key.includes('L') || key.includes('R')) return `${base} w-14 h-8 sm:w-16 sm:h-10 rounded-lg bg-white/10`;
    if (['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(key)) return `${base} w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/10`;
    return `${base} w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/10`; 
  };

    const getBaseStyle = (key: string) => {
    const margin = isMobile ? 10 : 20;
    const style: React.CSSProperties = {
      position: 'fixed' as const,
    };

    if (['R1', 'R2', 'R3', 'ANALOG_R', 'TRIANGLE', 'CIRCLE', 'CROSS', 'SQUARE'].includes(key)) {
      style.left = 'auto'; style.right = margin;
    } else if (['SELECT', 'START'].includes(key)) {
      style.left = '50%';
    } else {
      style.left = margin;
    }

    if (['L1', 'L2', 'R1', 'R2'].includes(key)) {
      style.top = margin; style.bottom = 'auto';
    } else if (['SELECT', 'START'].includes(key)) {
      style.top = 'auto'; style.bottom = margin + 20;
    } else {
      style.top = 'auto'; style.bottom = margin;
    }

    return style;
  };

  return (
    <div className={`fixed inset-0 pointer-events-none z-[80] ${isEditing ? 'bg-black select-none overflow-hidden' : ''}`}>
      {isEditing && (
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
          <div className="grid grid-cols-12 gap-0 w-full h-full">
             {Array.from({ length: 144 }).map((_, i) => <div key={i} className="border border-white/20 w-full h-full" />)}
          </div>
        </div>
      )}

      {Object.entries(positions).map(([key, config]) => {
        const isCenter = ['SELECT', 'START'].includes(key);
        const mobileScaleFactor = isMobile ? 0.75 : 1;
        
        return (
          <motion.div
            key={key}
            drag={isEditing}
            dragMomentum={false}
            onDragStart={() => {
              setDraggingKey(key);
              hasDraggedRef.current = true;
              if (onSelect) onSelect(null);
            }}
            onDragEnd={(_, info) => {
              setDraggingKey(null);
              setTimeout(() => {
                hasDraggedRef.current = false;
              }, 100);
              const SNAP = 10; // 10px snap grid
              const rawX = config.x + (info.offset.x / mobileScaleFactor);
              const rawY = config.y + (info.offset.y / mobileScaleFactor);
              onPositionChange(key, { 
                x: Math.round(rawX / SNAP) * SNAP, 
                y: Math.round(rawY / SNAP) * SNAP 
              });
            }}
            onTap={(e) => {
              // Only select if it's a solid tap, we're editing, and we didn't just drag
              if (isEditing && onSelect && !hasDraggedRef.current) {
                onSelect(key);
              }
            }}
            initial={{
              x: config.x * mobileScaleFactor,
              y: config.y * mobileScaleFactor,
              scale: config.scale * mobileScaleFactor,
              opacity: config.opacity,
            }}
            animate={{
              x: config.x * mobileScaleFactor,
              y: config.y * mobileScaleFactor,
              scale: config.scale * mobileScaleFactor,
              opacity: config.opacity,
            }}
            style={{ 
              ...getBaseStyle(key),
              zIndex: selectedKey === key ? 100 : 80,
              cursor: isEditing ? 'move' : 'pointer',
              touchAction: 'none'
            }}
            className={`pointer-events-auto group ${isCenter ? 'ml-[-30px]' : ''}`}
          >
            <div className={`
              relative ${getButtonClass(key)}
              ${selectedKey === key ? 'ring-4 ring-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.5)]' : ''}
              ${isEditing ? 'hover:ring-2 hover:ring-white/50' : ''}
              ${draggingKey === key ? 'ring-2 ring-dashed ring-yellow-400 opacity-80 scale-105 shadow-2xl' : ''}
              ${activeButtons.includes(key) && !isEditing ? 'brightness-150 scale-110 drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]' : ''}
            `}>
              {renderIcon(key)}
              {isEditing && selectedKey === key && (
                <div className="absolute -top-8 -right-8 bg-blue-500 rounded-full p-1 shadow-lg">
                  <Settings2 className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          </motion.div>
        );
      })}

      {isEditing && !selectedKey && !draggingKey && (
        <div className="absolute bottom-4 left-4 sm:bottom-10 sm:left-10 z-[100] bg-black/50 backdrop-blur-xl border border-white/20 p-4 sm:p-6 rounded-2xl sm:rounded-3xl max-w-[200px] sm:max-w-sm pointer-events-auto shadow-2xl">
          <h2 className="text-white font-bold tracking-widest uppercase text-[10px] sm:text-xs mb-2">Control Customizer</h2>
          <p className="text-white/40 text-[8px] sm:text-[10px] leading-relaxed uppercase hidden sm:block">
            Click any button to adjust its properties. Drag buttons to move them.
            Positions are snapped to a 10px grid.
          </p>
          <p className="text-white/40 text-[8px] leading-relaxed uppercase sm:hidden">
            Tap to edit. Drag to move.
          </p>
        </div>
      )}
    </div>
  );
}
