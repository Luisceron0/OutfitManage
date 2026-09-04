"use client";

import { useState } from "react";
import { motion, PanInfo } from "framer-motion";
import { ChevronUp, ChevronDown } from "lucide-react";

export interface InfiniteTextWheelProps {
  items: string[];
  onSelectIndex: (index: number) => void;
  arrowColor?: string;
  color?: string;
  itemHeight?: number;
  visibleCount?: number;
}

const DRAG_THRESHOLD = 24;

export function InfiniteTextWheel({
  items,
  onSelectIndex,
  arrowColor = "#5b58eb",
  color = "#71717a",
  itemHeight = 40,
  visibleCount = 5,
}: InfiniteTextWheelProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const total = items.length;
  const half = Math.floor(visibleCount / 2);

  const select = (index: number) => {
    if (total === 0) return;
    const normalized = ((index % total) + total) % total;
    setActiveIndex(normalized);
    onSelectIndex(normalized);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > DRAG_THRESHOLD) {
      select(activeIndex - 1);
    } else if (info.offset.y < -DRAG_THRESHOLD) {
      select(activeIndex + 1);
    }
  };

  if (total === 0) return null;

  return (
    <div
      className="relative flex flex-col items-center select-none"
      style={{ height: itemHeight * visibleCount }}
    >
      <button
        type="button"
        onClick={() => select(activeIndex - 1)}
        aria-label="Anterior"
        className="absolute -top-1 z-10 p-1 rounded-full hover:bg-white/5 transition-colors"
      >
        <ChevronUp className="w-4 h-4" style={{ color: arrowColor }} />
      </button>

      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-white/10" />

      <motion.div
        className="flex flex-col items-center justify-center h-full w-full cursor-grab active:cursor-grabbing"
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.4}
        onDragEnd={handleDragEnd}
      >
        {Array.from({ length: visibleCount }).map((_, slot) => {
          const offset = slot - half;
          const index = ((activeIndex + offset) % total + total) % total;
          const isActive = offset === 0;
          const distance = Math.abs(offset);

          return (
            <motion.button
              key={`${index}-${slot}`}
              type="button"
              onClick={() => select(index)}
              animate={{
                opacity: isActive ? 1 : Math.max(0.15, 1 - distance * 0.35),
                scale: isActive ? 1 : Math.max(0.75, 1 - distance * 0.1),
              }}
              transition={{ duration: 0.2 }}
              style={{ height: itemHeight, color: isActive ? "#ffffff" : color }}
              className={`flex items-center justify-center w-full text-center font-mono text-xs tracking-wide truncate px-4 ${
                isActive ? "font-bold" : "font-normal"
              }`}
            >
              {items[index]}
            </motion.button>
          );
        })}
      </motion.div>

      <button
        type="button"
        onClick={() => select(activeIndex + 1)}
        aria-label="Siguiente"
        className="absolute -bottom-1 z-10 p-1 rounded-full hover:bg-white/5 transition-colors"
      >
        <ChevronDown className="w-4 h-4" style={{ color: arrowColor }} />
      </button>
    </div>
  );
}

export default InfiniteTextWheel;
