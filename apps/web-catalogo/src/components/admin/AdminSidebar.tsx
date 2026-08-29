'use client';

import { useState, useEffect } from 'react';
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
  PanelLeftClose,
  PanelLeftOpen,
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

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('admin_sidebar_collapsed');
    if (saved === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('admin_sidebar_collapsed', next ? 'true' : 'false');
      return next;
    });
  };

  const userInitials = user?.nombre
    ? user.nombre
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'AD';

  return (
    <aside
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } hidden lg:flex border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#090d16] flex-col justify-between shrink-0 h-screen sticky top-0 transition-all duration-300 ease-in-out z-10`}
    >
      <div>
        {/* Header con Logo y Botón de Contraer/Extender */}
        <div
          className={`p-4 border-b border-slate-200 dark:border-slate-800/60 flex items-center ${
            isCollapsed ? 'justify-center flex-col gap-3 py-5' : 'justify-between'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-emerald-400 p-[2px] shadow-lg shadow-sky-500/20 shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-sky-400" />
              </div>
            </div>
            {!isCollapsed && (
              <div className="min-w-0 animate-fadeIn">
                <span className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight truncate block">
                  OutfitManage
                </span>
                <span className="block text-[10px] font-bold text-sky-600 dark:text-sky-400 tracking-wider uppercase truncate font-mono">
                  Admin & Inventario
                </span>
              </div>
            )}
          </div>

          <button
            onClick={toggleCollapse}
            title={isCollapsed ? 'Extender barra lateral' : 'Contraer barra lateral'}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all shadow-xs"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-sky-500" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-slate-400 hover:text-slate-900 dark:hover:text-white" />
            )}
          </button>
        </div>

        {/* Enlace rápido a Tienda Virtual */}
        <div className="px-3 pt-4">
          <Link
            href="/"
            title="Ver Tienda Virtual"
            className={`flex items-center ${
              isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3.5 py-2'
            } rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 hover:text-slate-900 dark:hover:text-white transition-all shadow-xs group relative`}
          >
            <Store className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform shrink-0" />
            {!isCollapsed && <span>Ver Tienda Virtual</span>}

            {/* Tooltip en modo contraído */}
            {isCollapsed && (
              <div className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 font-mono">
                Ver Tienda Virtual
              </div>
            )}
          </Link>
        </div>

        {/* Navegación del Panel */}
        <nav className="p-3 space-y-1.5 mt-2">
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
                className={`flex items-center ${
                  isCollapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-2.5'
                } rounded-xl text-xs font-semibold transition-all relative group ${
                  isActive
                    ? 'bg-sky-500 text-white font-bold shadow-md shadow-sky-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}

                {/* Tooltip flotante en modo contraído */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 font-mono">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Perfil de Usuario y Cerrar Sesión */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/60 space-y-2">
        {user && (
          <div
            className={`p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 flex items-center ${
              isCollapsed ? 'justify-center flex-col gap-2' : 'justify-between'
            }`}
          >
            {isCollapsed ? (
              <div
                className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center font-bold text-xs font-mono shadow-xs cursor-default relative group"
                title={`${user.nombre} (${user.rol})`}
              >
                {userInitials}
                <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  <span className="block font-bold">{user.nombre}</span>
                  <span className="block text-[10px] text-sky-400 dark:text-sky-600 font-mono uppercase">
                    {user.rol}
                  </span>
                </div>
              </div>
            ) : (
              <div className="min-w-0 pr-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                  {user.nombre}
                </span>
                <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400 uppercase tracking-wider block font-bold">
                  {user.rol}
                </span>
              </div>
            )}

            <button
              onClick={logout}
              title="Cerrar sesión"
              className={`p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors relative group ${
                isCollapsed ? 'w-8 h-8 flex items-center justify-center' : ''
              }`}
            >
              <LogOut className="w-4 h-4" />
              {isCollapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 font-mono">
                  Cerrar Sesión
                </div>
              )}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
