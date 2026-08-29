'use client';

import { Search, RotateCcw, SlidersHorizontal } from 'lucide-react';

interface ProductFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedSize: string | null;
  onSizeChange: (size: string | null) => void;
  selectedColor: string | null;
  onColorChange: (color: string | null) => void;
  onReset: () => void;
  totalResults: number;
}

const TALLAS_COMUNES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38'];
const COLORES_COMUNES = ['Negro', 'Blanco', 'Azul', 'Rojo', 'Verde', 'Gris', 'Beige', 'Rosado'];

export default function ProductFilters({
  search,
  onSearchChange,
  selectedSize,
  onSizeChange,
  selectedColor,
  onColorChange,
  onReset,
  totalResults,
}: ProductFiltersProps) {
  const hasActiveFilters = Boolean(search || selectedSize || selectedColor);

  return (
    <div className="space-y-4">
      {/* Barra de Búsqueda Principal */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por prenda, estilo o descripción..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white shadow-sm"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Indicador de Resultados y Reset */}
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="text-slate-900 dark:text-white font-bold">{totalResults}</span> prendas encontradas
          </span>

          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Selectores de Filtro Rápido (Tallas y Colores) */}
      <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-200 dark:border-slate-800/60 text-xs">
        {/* Tallas */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-500 dark:text-slate-400 font-medium mr-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3" /> Talla:
          </span>
          {TALLAS_COMUNES.map((talla) => {
            const isSelected = selectedSize === talla;
            return (
              <button
                key={talla}
                onClick={() => onSizeChange(isSelected ? null : talla)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  isSelected
                    ? 'bg-sky-500 text-white shadow-sm border border-sky-400'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                }`}
              >
                {talla}
              </button>
            );
          })}
        </div>

        {/* Colores */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-500 dark:text-slate-400 font-medium mr-1">Color:</span>
          {COLORES_COMUNES.map((color) => {
            const isSelected = selectedColor === color;
            return (
              <button
                key={color}
                onClick={() => onColorChange(isSelected ? null : color)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  isSelected
                    ? 'bg-sky-500 text-white shadow-sm border border-sky-400'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                }`}
              >
                {color}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
