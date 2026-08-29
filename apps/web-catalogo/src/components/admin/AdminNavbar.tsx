'use client';

import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';
import { useTheme } from '../../lib/theme-context';
import { ExternalLink, UserCheck, Store, Sun, Moon, Menu, Sparkles } from 'lucide-react';

interface AdminNavbarProps {
  onOpenMobileMenu?: () => void;
}

export default function AdminNavbar({ onOpenMobileMenu }: AdminNavbarProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-[#0a0f1a]/80 backdrop-blur-md px-2.5 sm:px-6 flex items-center justify-between sticky top-0 z-10 w-full max-w-full overflow-hidden transition-colors">
      {/* Left side: Hamburger on mobile + DB Status */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Mini Logo */}
        <div className="flex lg:hidden items-center gap-2 shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-emerald-400 p-[1.5px] shadow-sm shrink-0">
            <div className="w-full h-full bg-slate-900 rounded-[6px] sm:rounded-[7px] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            </div>
          </div>
          <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white tracking-tight truncate hidden sm:inline">
            OutfitManage
          </span>
        </div>

        {/* DB Status info on larger screens */}
        <span className="hidden md:inline-flex text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
          Modo: <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-1 truncate">Conectado a BD Local</span>
        </span>
      </div>

      {/* Right side: Theme toggle, Store link, User badge */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors shrink-0"
          title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          )}
        </button>

        {/* Store Link */}
        <Link
          href="/"
          title="Ver Tienda Virtual"
          className="inline-flex items-center gap-1.5 p-1.5 sm:px-3.5 sm:py-1.5 rounded-xl text-xs font-bold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/30 hover:bg-sky-500/20 transition-all shrink-0"
        >
          <Store className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Tienda Virtual</span>
          <ExternalLink className="w-3 h-3 opacity-60 hidden md:inline" />
        </Link>

        {/* User Badge */}
        {user && (
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-700 dark:text-slate-300 pl-1.5 sm:pl-2 border-l border-slate-200 dark:border-slate-800 shrink-0">
            <UserCheck className="w-4 h-4 text-sky-500 hidden sm:inline" />
            <span className="hidden lg:inline max-w-[100px] truncate">
              <strong className="text-slate-900 dark:text-white">{user.nombre}</strong>
            </span>
            <span className={`text-[9px] sm:text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 ${
              user.rol === 'ADMIN'
                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                : user.rol === 'BODEGA'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            }`}>
              {user.rol}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
