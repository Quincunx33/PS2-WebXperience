import { motion } from "motion/react";
import { Circle, Hexagon, Triangle, Square, MoveUp, MoveDown, MoveLeft, MoveRight, GripVertical } from "lucide-react";

interface ControllerProps {
  size?: string;
  isEditing?: boolean;
  positions?: {
    dpad: { x: number, y: number };
    actions: { x: number, y: number };
    center: { x: number, y: number };
    shoulders: { x: number, y: number };
  };
  onPositionChange?: (key: string, pos: { x: number, y: number }) => void;
}

export default function PS2VirtualController({ 
  size = "md", 
  isEditing = false, 
  positions = { dpad: { x: 0, y: 0 }, actions: { x: 0, y: 0 }, center: { x: 0, y: 0 }, shoulders: { x: 0, y: 0 } },
  onPositionChange
}: ControllerProps) {
  const scale = size === "sm" ? "scale-75 origin-center" : size === "lg" ? "scale-110 origin-center" : "scale-100 origin-center";

  return (
    <div className={`fixed inset-0 pointer-events-none z-[60] ${isEditing ? 'bg-blue-500/10 backdrop-blur-[2px]' : ''}`}>
      {isEditing && (
        <div className="absolute inset-x-0 top-10 flex flex-col items-center gap-2">
            <span className="bg-blue-600 text-white text-[10px] font-bold px-6 py-2 rounded-full uppercase tracking-[0.2em] shadow-2xl border border-white/20">
              Layout Editor Mode
            </span>
            <span className="text-white/40 text-[9px] uppercase">Drag any group to reposition</span>
        </div>
      )}

      {/* Shoulder Buttons */}
      <motion.div
        drag={isEditing}
        dragMomentum={false}
        onDragEnd={(_, info) => onPositionChange?.('shoulders', { x: positions.shoulders.x + info.offset.x, y: positions.shoulders.y + info.offset.y })}
        style={{ x: positions.shoulders.x, y: positions.shoulders.y }}
        className={`fixed top-12 inset-x-12 pointer-events-auto flex justify-between gap-4 ${scale} ${isEditing ? 'cursor-move ring-2 ring-blue-500 rounded-2xl p-4' : ''}`}
      >
        <div className="flex gap-2">
          <button className="w-16 h-10 bg-white/10 active:bg-white/20 backdrop-blur-md rounded-lg border border-white/10 text-[10px] font-bold text-white/50 transition-all uppercase">L1</button>
          <button className="w-16 h-10 bg-white/10 active:bg-white/20 backdrop-blur-md rounded-lg border border-white/10 text-[10px] font-bold text-white/50 transition-all uppercase">L2</button>
        </div>
        <div className="flex gap-2">
          <button className="w-16 h-10 bg-white/10 active:bg-white/20 backdrop-blur-md rounded-lg border border-white/10 text-[10px] font-bold text-white/50 transition-all uppercase">R2</button>
          <button className="w-16 h-10 bg-white/10 active:bg-white/20 backdrop-blur-md rounded-lg border border-white/10 text-[10px] font-bold text-white/50 transition-all uppercase">R1</button>
        </div>
      </motion.div>

      {/* Left Side: D-Pad */}
      <motion.div 
        drag={isEditing}
        dragMomentum={false}
        onDragEnd={(_, info) => onPositionChange?.('dpad', { x: positions.dpad.x + info.offset.x, y: positions.dpad.y + info.offset.y })}
        style={{ x: positions.dpad.x, y: positions.dpad.y }}
        className={`fixed left-12 bottom-12 pointer-events-auto flex flex-col items-center gap-2 ${scale} ${isEditing ? 'cursor-move ring-2 ring-blue-500/50 ring-offset-8 ring-offset-black/50 rounded-3xl p-4 bg-blue-500/5' : ''}`}
      >
        {isEditing && <GripVertical className="absolute -top-10 text-blue-400 w-5 h-5 animate-bounce" />}
        <button className="w-14 h-14 bg-white/10 active:bg-white/20 backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-center shadow-lg transform active:scale-95 transition-all">
          <MoveUp className="w-6 h-6 text-white/50" />
        </button>
        <div className="flex gap-2">
          <button className="w-14 h-14 bg-white/10 active:bg-white/20 backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-center shadow-lg transform active:scale-95 transition-all">
            <MoveLeft className="w-6 h-6 text-white/50" />
          </button>
          <button className="w-14 h-14 bg-white/10 active:bg-white/20 backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-center shadow-lg transform active:scale-95 transition-all">
            <MoveRight className="w-6 h-6 text-white/50" />
          </button>
        </div>
        <button className="w-14 h-14 bg-white/10 active:bg-white/20 backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-center shadow-lg transform active:scale-95 transition-all">
          <MoveDown className="w-6 h-6 text-white/50" />
        </button>
      </motion.div>

      {/* Middle: Select/Start */}
      <motion.div 
        drag={isEditing}
        dragMomentum={false}
        onDragEnd={(_, info) => onPositionChange?.('center', { x: positions.center.x + info.offset.x, y: positions.center.y + info.offset.y })}
        style={{ x: positions.center.x, y: positions.center.y }}
        className={`fixed left-1/2 bottom-12 -translate-x-1/2 flex gap-4 scale-90 sm:scale-100 ${isEditing ? 'cursor-move ring-2 ring-blue-500/50 ring-offset-4 rounded-full' : ''}`}
      >
        <button className="px-6 py-2 bg-white/5 active:bg-white/15 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-bold tracking-widest text-white/40 pointer-events-auto transform active:scale-95 transition-all">
          SELECT
        </button>
        <button className="px-6 py-2 bg-white/5 active:bg-white/15 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-bold tracking-widest text-white/40 pointer-events-auto transform active:scale-95 transition-all">
          START
        </button>
      </motion.div>

      {/* Right Side: Action Buttons */}
      <motion.div 
        drag={isEditing}
        dragMomentum={false}
        onDragEnd={(_, info) => onPositionChange?.('actions', { x: positions.actions.x + info.offset.x, y: positions.actions.y + info.offset.y })}
        style={{ x: positions.actions.x, y: positions.actions.y }}
        className={`fixed right-12 bottom-12 pointer-events-auto relative w-40 h-40 flex items-center justify-center ${scale} ${isEditing ? 'cursor-move ring-2 ring-blue-500/50 ring-offset-8 ring-offset-black/50 rounded-full' : ''}`}
      >
        {isEditing && <GripVertical className="absolute -top-6 text-blue-400 w-5 h-5 animate-bounce" />}
        <button className="absolute top-0 w-14 h-14 bg-white/10 active:bg-white/20 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center shadow-lg transform active:scale-95 transition-all">
           <Triangle className="w-6 h-6 text-green-400/50 rotate-0" />
        </button>
        <button className="absolute right-0 w-14 h-14 bg-white/10 active:bg-white/20 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center shadow-lg transform active:scale-95 transition-all">
           <Circle className="w-6 h-6 text-red-500/50" />
        </button>
        <button className="absolute left-0 w-14 h-14 bg-white/10 active:bg-white/20 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center shadow-lg transform active:scale-95 transition-all">
           <span className="text-2xl text-pink-400/50 font-bold mb-1">□</span>
        </button>
        <button className="absolute bottom-0 w-14 h-14 bg-white/10 active:bg-white/20 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center shadow-lg transform active:scale-95 transition-all">
           <span className="text-2xl text-blue-400/50 font-bold mt-1">✕</span>
        </button>
      </motion.div>
    </div>
  );
}
