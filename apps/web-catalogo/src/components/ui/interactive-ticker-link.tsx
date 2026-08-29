"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, ExternalLink, Sparkles, Navigation } from "lucide-react";

export interface TickerItemData {
  title: string;
  subtitle?: string;
  image?: string;
  tag?: string;
}

export interface InteractiveTickerLinkProps {
  items?: TickerItemData[];
  mapsUrl?: string;
  storeAddress?: string;
  className?: string;
}

const DEFAULT_ITEMS: TickerItemData[] = [
  {
    title: "VISÍTANOS EN NUESTRO ATELIER",
    subtitle: "Cra. 13 #85-24, Zona Rosa • Bogotá, Colombia",
    image: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1200&fit=crop",
    tag: "Showroom Exclusivo",
  },
  {
    title: "ABRIR UBICACIÓN EN GOOGLE MAPS",
    subtitle: "Cómo llegar paso a paso con GPS",
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1200&fit=crop",
    tag: "Navegación en Vivo",
  },
  {
    title: "HORARIO: LUNES A SÁBADO 10AM – 8PM",
    subtitle: "Prueba de prendas & Asesoría de imagen",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200&fit=crop",
    tag: "Atención Personalizada",
  },
  {
    title: "EXPERIENCIA OUTFIT STUDIO",
    subtitle: "Colecciones limitadas disponibles en tienda física",
    image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1200&fit=crop",
    tag: "Sede Principal",
  },
];

export function InteractiveTickerLink({
  items = DEFAULT_ITEMS,
  mapsUrl = "https://maps.google.com/?q=Zona+Rosa+Bogota+Colombia",
  storeAddress = "Cra. 13 #85-24, Zona Rosa, Bogotá, Colombia",
  className = "",
}: InteractiveTickerLinkProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Duplicate items array to ensure seamless infinite looping marquee
  const repeatedItems = [...items, ...items, ...items];

  return (
    <div
      className={`relative w-full overflow-hidden bg-[#050505] py-8 border-y border-white/10 ${className}`}
    >
      {/* Background active image preview on hover */}
      {hoveredIdx !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 0.22, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={repeatedItems[hoveredIdx]?.image}
            alt="Store Preview"
            className="w-full h-full object-cover blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-[#050505]" />
        </motion.div>
      )}

      {/* Infinite Marquee Track */}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative z-10 group cursor-pointer"
        title="Abrir sede en Google Maps"
      >
        <motion.div
          className="flex w-max items-center gap-8 sm:gap-12"
          animate={{
            x: ["0%", "-50%"],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 28,
              ease: "linear",
            },
          }}
        >
          {repeatedItems.map((item, idx) => (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="flex items-center gap-4 sm:gap-6 px-4 py-2 rounded-2xl transition-all duration-300 group-hover:bg-white/[0.04]"
            >
              {/* Map pin pulse icon */}
              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-lg shrink-0">
                <MapPin className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </div>

              {/* Title & details */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight text-white group-hover:text-indigo-300 transition-colors uppercase whitespace-nowrap">
                    {item.title}
                  </span>
                  <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                {item.subtitle && (
                  <span className="text-xs sm:text-sm font-mono text-zinc-400 tracking-wider">
                    {item.subtitle}
                  </span>
                )}
              </div>

              {/* Tag Pill */}
              {item.tag && (
                <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-300 shrink-0">
                  {item.tag}
                </span>
              )}

              {/* Divider bullet */}
              <span className="text-indigo-500 text-lg sm:text-2xl font-black opacity-60">
                ✦
              </span>
            </div>
          ))}
        </motion.div>
      </a>

      {/* Subtle edge fade overlays */}
      <div className="absolute top-0 left-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-[#050505] to-transparent pointer-events-none z-20" />
      <div className="absolute top-0 right-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-[#050505] to-transparent pointer-events-none z-20" />
    </div>
  );
}

export default InteractiveTickerLink;
