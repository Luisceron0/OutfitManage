'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '../../lib/admin-api';
import { useAuth } from '../../lib/auth-context';
import { DashboardStats } from '../../types/admin';
import {
  Boxes,
  Shirt,
  ArrowLeftRight,
  TrendingUp,
  Warehouse,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  SlidersHorizontal,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      const data = await adminApi.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500 mb-3" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono">
          Cargando métricas de inventario...
        </span>
      </div>
    );
  }

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'ENTRADA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <ArrowDownLeft className="w-3 h-3" /> Entrada
          </span>
        );
      case 'SALIDA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <ArrowUpRight className="w-3 h-3" /> Salida
          </span>
        );
      case 'TRASLADO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <ArrowLeftRight className="w-3 h-3" /> Traslado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <SlidersHorizontal className="w-3 h-3" /> {tipo}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Panel de Inventario
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Resumen en tiempo real del inventario físico, existencias por sede y movimientos recientes
        </p>
      </div>

      {/* Tarjetas de Métricas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
              Stock Total
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono">
            {stats?.stockConsolidado || 0}{' '}
            <span className="text-xs font-normal text-slate-400">unidades</span>
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block">
            Saldo disponible en almacenes
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
              Prendas / Modelos
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Shirt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono">
            {stats?.totalProductos || 0}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
            Modelos creados en catálogo
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
              Variantes SKU Activas
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono">
            {stats?.totalVariantes || 0}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
            Combinaciones únicas talla/color
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
              Total Movimientos
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono">
            {stats?.totalMovimientos || 0}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
            Operaciones registradas con auditoría
          </span>
        </div>
      </div>

      {/* Distribución por Almacén */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Warehouse className="w-5 h-5 text-sky-500" />
          <span>Existencias por Sede Física</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats?.distribucionUbicaciones?.map((u) => (
            <div
              key={u.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm"
            >
              <div>
                <span className="text-sm font-bold text-slate-900 dark:text-white block">{u.nombre}</span>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Tipo: {u.tipo}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xl font-extrabold text-sky-600 dark:text-sky-400 font-mono">
                  {u.totalStock}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold">
                  unidades
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Últimos Movimientos Registrados en Stock */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Últimos Movimientos de Stock
          </h2>
          <Link
            href="/admin/inventario"
            className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
          >
            <span>Ver todos los movimientos</span>
            <span>→</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Tipo</th>
                  <th className="px-6 py-3.5 font-bold">Prenda / SKU</th>
                  <th className="px-6 py-3.5 font-bold">Ubicación</th>
                  <th className="px-6 py-3.5 font-bold text-right">Cantidad</th>
                  <th className="px-6 py-3.5 font-bold">Usuario</th>
                  <th className="px-6 py-3.5 font-bold">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                {stats?.ultimosMovimientos && stats.ultimosMovimientos.length > 0 ? (
                  stats.ultimosMovimientos.map((m) => (
                    <tr
                      key={m.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">{getTipoBadge(m.tipo)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-900 dark:text-white block font-mono text-[11px]">
                          {m.variante?.skuCode || 'SKU'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {m.variante?.producto?.nombre} ({m.variante?.talla}/{m.variante?.color})
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-slate-800 dark:text-slate-200 block">{m.ubicacion?.nombre || '—'}</span>
                        {m.ubicacionDestino && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-semibold">
                            → {m.ubicacionDestino.nombre}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-bold text-slate-900 dark:text-white text-sm">
                        {m.tipo === 'SALIDA' ? `-${m.cantidad}` : `+${m.cantidad}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                        {m.usuario?.nombre || 'Sistema'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {new Date(m.timestamp).toLocaleTimeString('es-CO', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No hay movimientos registrados recientemente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
