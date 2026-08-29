'use client';

import { useAuth } from '../lib/auth-context';
import { ExternalLink, UserCheck, Store } from 'lucide-react';

export default function Navbar() {
  const { user } = useAuth();

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#0a0f1a]/80 backdrop-blur-md px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-slate-400">
          Modo: <span className="text-emerald-400">Conectado a Base de Datos Local</span>
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Acceso a la Tienda Virtual (Catálogo Público) */}
        <a
          href="http://localhost:3001"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-500/10 text-sky-300 border border-sky-500/30 hover:bg-sky-500/20 transition-all"
        >
          <Store className="w-3.5 h-3.5" />
          <span>Ver Tienda Virtual</span>
          <ExternalLink className="w-3 h-3 opacity-60" />
        </a>

        {user && (
          <div className="flex items-center gap-2 text-xs text-slate-300 pl-2 border-l border-slate-800">
            <UserCheck className="w-4 h-4 text-sky-400" />
            <span>
              Usuario: <strong className="text-white">{user.nombre}</strong>
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
