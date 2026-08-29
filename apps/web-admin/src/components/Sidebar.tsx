'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import {
  LayoutDashboard,
  Shirt,
  ArrowLeftRight,
  Boxes,
  Sliders,
  LogOut,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Productos & SKUs', href: '/productos', icon: Shirt },
  { label: 'Movimientos Ledger', href: '/inventario', icon: ArrowLeftRight },
  { label: 'Consultar Stock', href: '/stock', icon: Boxes },
  { label: 'Ubicaciones & Categorías', href: '/configuracion', icon: Sliders },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();

  return (
    <aside className="w-64 glass-sidebar flex flex-col justify-between shrink-0 min-h-screen">
      <div className="p-6 space-y-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-[2px] shadow-lg shadow-sky-500/20">
            <div className="w-full h-full bg-[#0a0f1a] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-sky-400" />
            </div>
          </div>
          <div>
            <span className="text-lg font-bold text-white tracking-tight">Tienda360</span>
            <span className="block text-[10px] font-semibold text-sky-400 uppercase tracking-wider">
              Web Admin
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2 block">
            Gestión de Inventario
          </span>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Info & Logout Footer */}
      <div className="p-4 border-t border-slate-800/80 space-y-3">
        {user && (
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white truncate max-w-[130px]">
                {user.nombre}
              </span>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                  user.rol === 'ADMIN'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : user.rol === 'BODEGA'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                }`}
              >
                {user.rol}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block truncate mt-0.5">{user.email}</span>
          </div>
        )}

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
