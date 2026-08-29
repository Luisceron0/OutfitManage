"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Instagram,
  MessageCircle,
  MapPin,
  CheckCircle2,
  Send,
} from "lucide-react";
import { getWhatsAppUrl, STORE_INFO } from "../../lib/constants";

export interface FooterLinkItem {
  label: string;
  href: string;
  isExternal?: boolean;
}

export interface FooterColumn {
  title: string;
  links: FooterLinkItem[];
}

export interface LiquidGlassFooterProps {
  brandName?: string;
  brandTagline?: string;
  columns?: FooterColumn[];
  className?: string;
}

const DEFAULT_COLUMNS: FooterColumn[] = [
  {
    title: "Colección",
    links: [
      { label: "Streetwear Noir", href: "/catalogo" },
      { label: "Alta Sastrería", href: "/catalogo" },
      { label: "Denim Raw 14oz", href: "/catalogo" },
      { label: "Cápsula Botánica", href: "/catalogo" },
      { label: "Ver Todo el Catálogo", href: "/catalogo" },
    ],
  },
  {
    title: "Experiencia",
    links: [
      { label: "Showroom Bogotá", href: "#ubicacion" },
      { label: "Manifiesto de Marca", href: "#manifiesto" },
      { label: "Lookbook Editorial", href: "#scroller-editorial" },
      { label: "Opiniones de Clientes", href: "#testimonios" },
    ],
  },
  {
    title: "Atención VIP",
    links: [
      { label: "Asesoría por WhatsApp", href: getWhatsAppUrl(STORE_INFO.whatsappDefaultMsg), isExternal: true },
      { label: "Guía de Tallas & Calce", href: "/catalogo" },
      { label: "Política de Envíos", href: "/catalogo" },
      { label: "Ingreso / Mi Cuenta", href: "/login" },
    ],
  },
];

export function LiquidGlassFooter({
  brandName = "OUTFIT",
  brandTagline = "Moda contemporánea, cortes de vanguardia y textiles nobles. Confeccionado éticamente con algodón pima y siluetas exclusivas.",
  columns = DEFAULT_COLUMNS,
  className = "",
}: LiquidGlassFooterProps) {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubscribed(true);
    setTimeout(() => {
      setEmail("");
    }, 2500);
  };

  return (
    <footer className={`relative w-full max-w-6xl mx-auto px-4 sm:px-6 pb-12 pt-6 ${className}`}>
      {/* Outer Liquid Glass Metallic Border Wrap */}
      <div className="relative p-[1.5px] rounded-[36px] sm:rounded-[42px] bg-gradient-to-b from-white/25 via-white/10 to-white/20 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Inner Liquid Glass Container */}
        <div className="relative rounded-[35px] sm:rounded-[41px] bg-gradient-to-b from-zinc-900/90 via-zinc-950/95 to-black/95 backdrop-blur-3xl p-8 sm:p-12 md:p-14 space-y-12">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-1/4 w-[350px] h-[200px] bg-indigo-500/10 rounded-full blur-[90px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-[300px] h-[180px] bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

          {/* Top Row: Brand Info + Newsletter & Link Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 sm:gap-14 relative z-10">
            {/* Brand & Newsletter Column (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Brand Header */}
              <Link href="/" className="inline-flex items-center gap-2.5 text-white group">
                <div className="w-7 h-7 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-indigo-400 group-hover:text-amber-300 transition-colors">
                  <Sparkles className="w-4 h-4 fill-current" />
                </div>
                <span className="text-xl sm:text-2xl font-black tracking-wider font-mono">
                  {brandName}
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-400 border border-indigo-400/30 px-2 py-0.5 rounded-full bg-indigo-500/10">
                  STUDIO
                </span>
              </Link>

              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-sm">
                {brandTagline}
              </p>

              {/* Glass Newsletter Subscribe Form */}
              <div className="pt-2 space-y-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 block">
                  Únete a Nuestra Comunidad VIP
                </span>

                {isSubscribed ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 px-4 py-3 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>¡Gracias por suscribirte! Te notificaremos de lanzamientos.</span>
                  </motion.div>
                ) : (
                  <form
                    onSubmit={handleSubscribe}
                    className="flex items-center gap-2 max-w-md"
                  >
                    <div className="relative flex-1">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@correo.com"
                        required
                        className="w-full px-5 py-3 rounded-full bg-white/[0.06] border border-white/15 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-indigo-400 focus:bg-white/[0.1] transition-all backdrop-blur-md"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-5 py-3 rounded-full bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-all active:scale-95 shadow-md flex items-center gap-1.5 shrink-0"
                    >
                      <span>Suscribirme</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Link Columns (7 cols) */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
              {columns.map((col) => (
                <div key={col.title} className="space-y-4">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-300">
                    {col.title}
                  </h4>
                  <ul className="space-y-2.5">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          target={link.isExternal ? "_blank" : undefined}
                          rel={link.isExternal ? "noopener noreferrer" : undefined}
                          className="text-xs text-zinc-400 hover:text-white transition-colors duration-200 block"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />

          {/* Bottom Row: Copyright + Liquid Social Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
            <p className="text-xs font-mono text-zinc-500 text-center sm:text-left">
              © {new Date().getFullYear()} OutfitManage. Todos los derechos reservados.
            </p>

            {/* Glass Social Media Pills */}
            <div className="flex items-center gap-2.5">
              <a
                href={getWhatsAppUrl(STORE_INFO.whatsappDefaultMsg)}
                target="_blank"
                rel="noopener noreferrer"
                title="WhatsApp Oficial"
                className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/10 hover:border-emerald-400/40 hover:bg-emerald-500/10 text-zinc-300 hover:text-emerald-400 flex items-center justify-center transition-all shadow-sm group"
              >
                <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </a>

              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram"
                className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/10 hover:border-rose-400/40 hover:bg-rose-500/10 text-zinc-300 hover:text-rose-400 flex items-center justify-center transition-all shadow-sm group"
              >
                <Instagram className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </a>

              <a
                href="https://maps.google.com/?q=Cra+13+%2385-24+Bogota+Colombia"
                target="_blank"
                rel="noopener noreferrer"
                title="Google Maps Sede"
                className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/10 hover:border-indigo-400/40 hover:bg-indigo-500/10 text-zinc-300 hover:text-indigo-400 flex items-center justify-center transition-all shadow-sm group"
              >
                <MapPin className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default LiquidGlassFooter;
