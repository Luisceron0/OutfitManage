'use client';

import { CategoriaPublica } from '../types/catalogo';
import { LayoutGrid } from 'lucide-react';

interface CategoryNavProps {
  categorias: CategoriaPublica[];
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
}

export default function CategoryNav({
  categorias,
  selectedCategory,
  onSelectCategory,
}: CategoryNavProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      {/* Botón Todas */}
      <button
        onClick={() => onSelectCategory(null)}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 shrink-0 ${
          selectedCategory === null
            ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 border border-sky-400'
            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 shadow-sm'
        }`}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        <span>Todas las categorías</span>
      </button>

      {/* Categorías Dinámicas */}
      {categorias.map((cat) => {
        const isSelected = selectedCategory === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 shrink-0 ${
              isSelected
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 border border-sky-400'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 shadow-sm'
            }`}
          >
            <span>{cat.nombre}</span>
            {cat._count && cat._count.productos > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isSelected
                    ? 'bg-sky-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {cat._count.productos}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
