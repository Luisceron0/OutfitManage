'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ProductoPublicoItem } from '../types/catalogo';
import { formatCurrency } from '../lib/api';
import { Sparkles, ArrowUpRight, CheckCircle2, XCircle } from 'lucide-react';

interface ProductCardProps {
  producto: ProductoPublicoItem;
}

export default function ProductCard({ producto }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);

  // Un producto está disponible si al menos una variante tiene stock > 0
  const tieneDisponibilidad = producto.variantes.some((v) => v.disponible);

  // Extraer tallas y colores únicos disponibles
  const tallasDisponibles = Array.from(
    new Set(producto.variantes.filter((v) => v.disponible).map((v) => v.talla))
  );
  const coloresDisponibles = Array.from(
    new Set(producto.variantes.map((v) => v.color))
  );

  return (
    <div className="group flex flex-col bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 hover:border-sky-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-sky-500/10 hover:-translate-y-1">
      {/* Contenedor de Imagen */}
      <Link
        href={`/producto/${producto.productoId}`}
        className="relative aspect-[4/5] bg-slate-100 dark:bg-slate-950 overflow-hidden block"
      >
        {producto.imagenPrincipal && !imgError ? (
          <img
            src={producto.imagenPrincipal}
            alt={producto.nombre}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-slate-400 bg-slate-100 dark:bg-slate-900">
            <Sparkles className="w-10 h-10 mb-2 opacity-50 text-sky-500 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 text-center px-4">
              {producto.nombre}
            </span>
          </div>
        )}

        {/* Badge de Categoría */}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 dark:bg-black/70 backdrop-blur-md text-sky-700 dark:text-sky-300 border border-slate-200/80 dark:border-white/10 shadow-sm">
            {producto.categoria.nombre}
          </span>
        </div>

        {/* Badge de Disponibilidad */}
        <div className="absolute top-3 right-3">
          {tieneDisponibilidad ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 backdrop-blur-md shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Disponible
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-500/30 backdrop-blur-md">
              Agotado
            </span>
          )}
        </div>
      </Link>

      {/* Información del Producto */}
      <div className="p-5 flex flex-col flex-1 justify-between gap-4">
        <div>
          <Link
            href={`/producto/${producto.productoId}`}
            className="group/title flex items-start justify-between gap-2"
          >
            <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover/title:text-sky-500 transition-colors line-clamp-1">
              {producto.nombre}
            </h3>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover/title:text-sky-500 group-hover/title:translate-x-0.5 group-hover/title:-translate-y-0.5 transition-all shrink-0 mt-0.5" />
          </Link>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
            {producto.descripcion || 'Prenda exclusiva de alta confección.'}
          </p>
        </div>

        {/* Variantes: Tallas y Colores */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Tallas:</span>
            <div className="flex flex-wrap gap-1 justify-end">
              {tallasDisponibles.length > 0 ? (
                tallasDisponibles.map((talla) => (
                  <span
                    key={talla}
                    className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  >
                    {talla}
                  </span>
                ))
              ) : (
                <span className="text-[10px] text-rose-500">Sin stock</span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Colores:</span>
            <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
              {coloresDisponibles.join(', ')}
            </span>
          </div>
        </div>

        {/* Precio y Botón Ver */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block font-mono">
              Precio
            </span>
            <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
              {formatCurrency(producto.precioActual)}
            </span>
          </div>

          <Link
            href={`/producto/${producto.productoId}`}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-black hover:opacity-90 transition-all shadow-sm flex items-center gap-1"
          >
            <span>Ver Prenda</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
