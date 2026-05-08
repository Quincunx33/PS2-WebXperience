import { motion } from "motion/react";
import { Circle, Hexagon, Triangle, Square, MoveUp, MoveDown, MoveLeft, MoveRight } from "lucide-react";

export default function PS2VirtualController({ size = "md" }: { size?: string }) {
  const scale = size === "sm" ? "scale-75 origin-left" : size === "lg" ? "scale-110 origin-left" : "scale-100 origin-left";
  const rightScale = size === "sm" ? "scale-75 origin-right" : size === "lg" ? "scale-110 origin-right" : "scale-100 origin-right";

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] flex items-end justify-between p-6 sm:p-12 lg:hidden">
      {/* Left Side: D-Pad */}
      <div className={`pointer-events-auto flex flex-col items-center gap-2 ${scale}`}>
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
      </div>

      {/* Middle: Select/Start */}
      <div className="absolute left-1/2 bottom-12 -translate-x-1/2 flex gap-4 scale-90 sm:scale-100 mb-20 sm:mb-0">
        <button className="px-6 py-2 bg-white/5 active:bg-white/15 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-bold tracking-widest text-white/40 pointer-events-auto transform active:scale-95 transition-all">
          SELECT
        </button>
        <button className="px-6 py-2 bg-white/5 active:bg-white/15 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-bold tracking-widest text-white/40 pointer-events-auto transform active:scale-95 transition-all">
          START
        </button>
      </div>

      {/* Right Side: Action Buttons */}
      <div className={`pointer-events-auto relative w-40 h-40 flex items-center justify-center ${rightScale}`}>
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
      </div>
    </div>
  );
}
