"use client";

import React from "react";
import { TextRevealScroll } from "../ui/text-reveal-scroll";
import { Sparkles } from "lucide-react";

export function ManifestoRevealSection() {
  return (
    <section
      id="manifiesto"
      className="relative w-full bg-[#050505] text-white py-28 sm:py-40 px-6 sm:px-8 border-t border-white/5 overflow-hidden flex flex-col items-center justify-center"
    >
      {/* Glow ambient background sutil */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center text-center space-y-8 sm:space-y-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-widest text-zinc-300">
            Manifiesto &amp; Filosofía de Marca
          </span>
        </div>

        {/* Text Reveal on Scroll */}
        <div className="w-full">
          <TextRevealScroll
            revealMode="words"
            startOffset={85}
            endOffset={25}
            dimOpacity={0.18}
            className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-snug sm:leading-tight font-sans text-center"
          >
            No confeccionamos prendas para seguir tendencias efímeras. Diseñamos piezas exclusivas con patronaje de alta costura, algodón pima y textiles nobles para quienes entienden que vestir bien es una declaración de carácter y autenticidad.
          </TextRevealScroll>
        </div>

        {/* Subtitle / Signature */}
        <div className="pt-4 flex items-center gap-3 text-xs sm:text-sm font-mono text-zinc-500 uppercase tracking-widest">
          <span className="w-6 sm:w-12 h-[1px] bg-zinc-800"></span>
          <span>Outfit Studio • Edición Limitada</span>
          <span className="w-6 sm:w-12 h-[1px] bg-zinc-800"></span>
        </div>
      </div>
    </section>
  );
}
