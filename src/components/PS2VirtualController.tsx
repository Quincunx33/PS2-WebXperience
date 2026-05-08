import { motion } from "motion/react";
import { Circle, Triangle, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Settings2 } from "lucide-react";
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
}

export default function PS2VirtualController({ 
  isEditing = false, 
  positions,
  onPositionChange,
  selectedKey = null,
  onSelect
}: ControllerProps) {
  const [windowWidth, setWindowWidth] = React.useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
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
      case 'TRIANGLE': return <Triangle className="w-full h-full text-green-400" />;
      case 'CIRCLE': return <Circle className="w-full h-full text-red-500" />;
      case 'CROSS': return <span className="text-2xl text-blue-400 font-bold">✕</span>;
      case 'SQUARE': return <span className="text-2xl text-pink-400 font-bold">□</span>;
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
    if (key.includes('ANALOG')) return `${base} w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/5`;
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

    if (key.startsWith('R') || ['TRIANGLE', 'CIRCLE', 'CROSS', 'SQUARE', 'ANALOG_R', 'R3'].includes(key)) {
      style.left = 'auto'; style.right = margin;
    } else if (['SELECT', 'START'].includes(key)) {
      style.left = '50%';
    } else {
      style.left = margin;
    }

    if ((key.startsWith('L') || key.startsWith('R')) && !key.includes('3')) {
      style.top = margin; style.bottom = 'auto';
    } else {
      style.top = 'auto'; style.bottom = margin;
    }

    return style;
  };

  return (
    <div className={`fixed inset-0 pointer-events-none z-[80] ${isEditing ? 'bg-black select-none overflow-hidden' : ''}`}>
      {isEditing && (
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
          <div className="grid grid-cols-12 gap-4 w-full h-full p-4">
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
            onDragEnd={(_, info) => {
              onPositionChange(key, { 
                x: config.x + (info.offset.x / mobileScaleFactor), 
                y: config.y + (info.offset.y / mobileScaleFactor) 
              });
            }}
            onTap={() => isEditing && onSelect?.(key)}
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

      {isEditing && !selectedKey && (
        <div className="absolute bottom-10 left-10 z-[100] bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl max-w-sm pointer-events-auto">
          <h2 className="text-white font-bold tracking-widest uppercase text-xs mb-2">Control Customizer</h2>
          <p className="text-white/40 text-[10px] leading-relaxed uppercase">
            Click any button to adjust its properties. Drag buttons to move them.
            Positions are relative to screen corners for better landscape support.
          </p>
        </div>
      )}
    </div>
  );
}
