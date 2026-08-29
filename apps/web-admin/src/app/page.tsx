'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api';
import { DashboardStats } from '../types';
import {
  Shirt,
  Boxes,
  ArrowLeftRight,
  Warehouse,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  SlidersHorizontal,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error cargando métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'ENTRADA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <ArrowDownLeft className="w-3 h-3" /> Entrada
          </span>
        );
      case 'SALIDA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <ArrowUpRight className="w-3 h-3" /> Salida
          </span>
        );
      case 'TRASLADO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <ArrowRightLeft className="w-3 h-3" /> Traslado
          </span>
        );
      case 'AJUSTE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <SlidersHorizontal className="w-3 h-3" /> Ajuste
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-300">
            {tipo}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header del Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Panel de Inventario
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Trazabilidad en tiempo real y registro inmutable de movimientos
          </p>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex items-center gap-3">
          <button
            onClick={loadStats}
            className="p-2.5 rounded-xl glass-card text-slate-400 hover:text-white transition-all"
            title="Refrescar métricas"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            href="/inventario"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20 transition-all"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Registrar Movimiento</span>
          </Link>

          <Link
            href="/productos"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </Link>
        </div>
      </div>

      {loading && !stats ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-sky-400 mb-3" />
          <span className="text-xs font-semibold uppercase tracking-wider">Cargando métricas...</span>
        </div>
      ) : stats ? (
        <>
          {/* Tarjetas de Estadísticas Principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Stock Consolidado */}
            <div className="p-6 rounded-2xl glass-card border-slate-800 space-y-3 relative overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Stock Consolidado
                </span>
                <div className="text-3xl font-extrabold text-white tracking-tight mt-1">
                  {stats.stockTotal.toLocaleString()}
                </div>
              </div>
              <span className="text-[11px] text-emerald-400 font-medium block">
                Unidades físicas totales en almacenes
              </span>
            </div>

            {/* Productos */}
            <div className="p-6 rounded-2xl glass-card border-slate-800 space-y-3 relative overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
                <Shirt className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Modelos de Prenda
                </span>
                <div className="text-3xl font-extrabold text-white tracking-tight mt-1">
                  {stats.totalProductos}
                </div>
              </div>
              <span className="text-[11px] text-slate-400 font-medium block">
                Catálogo base de productos
              </span>
            </div>

            {/* Variantes (SKUs) */}
            <div className="p-6 rounded-2xl glass-card border-slate-800 space-y-3 relative overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  SKUs Activos
                </span>
                <div className="text-3xl font-extrabold text-white tracking-tight mt-1">
                  {stats.totalVariantes}
                </div>
              </div>
              <span className="text-[11px] text-indigo-400 font-medium block">
                Combinaciones únicas talla/color
              </span>
            </div>

            {/* Movimientos Ledger */}
            <div className="p-6 rounded-2xl glass-card border-slate-800 space-y-3 relative overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Auditoría Ledger
                </span>
                <div className="text-3xl font-extrabold text-white tracking-tight mt-1">
                  {stats.totalMovimientos}
                </div>
              </div>
              <span className="text-[11px] text-slate-400 font-medium block">
                Transacciones registradas
              </span>
            </div>
          </div>

          {/* Distribución por Ubicación */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-sky-400" />
              <span>Existencias por Ubicación (Bodegas & Tiendas)</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.resumenUbicaciones.map((ub) => (
                <div
                  key={ub.id}
                  className="p-5 rounded-2xl glass-card border-slate-800 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <span className="text-sm font-bold text-white block">{ub.nombre}</span>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Tipo: {ub.tipo}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-white tracking-tight block">
                      {ub.stockTotal.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase font-medium">unidades</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Últimos Movimientos Ledger */}
          <div className="p-6 rounded-3xl glass-card border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Últimos Movimientos de Inventario
                </h2>
                <p className="text-xs text-slate-400">
                  Registro cronológico append-only con autoría
                </p>
              </div>

              <Link
                href="/inventario"
                className="text-xs font-bold text-sky-400 hover:text-sky-300 underline"
              >
                Ver todo el historial
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="pb-3 px-3">Tipo</th>
                    <th className="pb-3 px-3">Prenda & SKU</th>
                    <th className="pb-3 px-3">Ubicación</th>
                    <th className="pb-3 px-3 text-right">Cantidad</th>
                    <th className="pb-3 px-3">Usuario</th>
                    <th className="pb-3 px-3">Fecha y Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {stats.ultimosMovimientos.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3">{getTipoBadge(m.tipo)}</td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-white block">
                          {m.variante.producto.nombre}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {m.variante.skuCode} ({m.variante.talla} / {m.variante.color})
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        <span>{m.ubicacion.nombre}</span>
                        {m.ubicacionDestino && (
                          <span className="text-amber-400 block text-[11px]">
                            → {m.ubicacionDestino.nombre}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-white">
                        {m.tipo === 'SALIDA' ? `-${m.cantidad}` : `+${m.cantidad}`}
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        <span>{m.usuario.nombre}</span>
                        <span className="text-[10px] text-slate-500 block uppercase">
                          {m.usuario.rol}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                        {new Date(m.timestamp).toLocaleString('es-CO')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
