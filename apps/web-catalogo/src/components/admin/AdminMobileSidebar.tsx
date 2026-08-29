'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import {
  LayoutDashboard,
  Shirt,
  ArrowLeftRight,
  Warehouse,
  Users,
  LogOut,
  Sparkles,
  Store,
  Boxes,
  X,
} from 'lucide-react';

function getNavItemsForRole(rol?: string) {
  if (rol === 'VENDEDOR') {
    return [
      { label: 'Terminal de Ventas', href: '/admin/ventas', icon: Store },
      { label: 'Historial de Salidas', href: '/admin/inventario', icon: ArrowLeftRight },
      { label: 'Explorador de Stock', href: '/admin/stock', icon: Boxes },
    ];
  }

  if (rol === 'BODEGA') {
    return [
      { label: 'Recepción & Movimientos', href: '/admin/inventario', icon: ArrowLeftRight },
      { label: 'Explorador de Stock', href: '/admin/stock', icon: Boxes },
      { label: 'Almacenes & Sedes', href: '/admin/configuracion', icon: Warehouse },
    ];
  }

  // Default: ADMIN
  return [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Terminal de Ventas', href: '/admin/ventas', icon: Store },
    { label: 'Productos & Catálogo', href: '/admin/productos', icon: Shirt },
    { label: 'Historial de Movimientos', href: '/admin/inventario', icon: ArrowLeftRight },
    { label: 'Explorador de Stock', href: '/admin/stock', icon: Boxes },
    { label: 'Gestión de Usuarios', href: '/admin/usuarios', icon: Users },
    { label: 'Almacenes & Categorías', href: '/admin/configuracion', icon: Warehouse },
  ];
}

interface AdminMobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminMobileSidebar({ isOpen, onClose }: AdminMobileSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Close drawer automatically on route change
  useEffect(() => {
    onClose();
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] lg:hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-fadeIn"
      />

      {/* Drawer Panel */}
      <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-[#090d16] border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-2xl z-10 animate-slideRight">
        <div>
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-emerald-400 p-[2px] shadow-lg shadow-sky-500/20 shrink-0">
                <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                </div>
              </div>
              <div>
                <span className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight block">
                  OutfitManage
                </span>
                <span className="block text-[10px] font-bold text-sky-600 dark:text-sky-400 tracking-wider uppercase font-mono">
                  Admin & Inventario
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick link to store */}
          <div className="px-4 pt-4">
            <Link
              href="/"
              onClick={onClose}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 hover:text-slate-900 dark:hover:text-white transition-all shadow-xs"
            >
              <Store className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Ver Tienda Virtual</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 mt-2 overflow-y-auto max-h-[calc(100vh-250px)]">
            {getNavItemsForRole(user?.rol).map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-sky-500 text-white font-bold shadow-md shadow-sky-500/25'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Logout in Mobile Drawer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800/60 space-y-2">
          {user && (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                  {user.nombre}
                </span>
                <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400 uppercase tracking-wider block font-bold">
                  {user.rol}
                </span>
              </div>

              <button
                onClick={() => {
                  onClose();
                  logout();
                }}
                title="Cerrar sesión"
                className="p-2 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
