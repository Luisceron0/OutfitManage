'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { useToast } from '../../lib/toast-context';
import {
  Producto,
  Ubicacion,
  MovimientoInventario,
  TipoMovimiento,
} from '../../types';
import {
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  SlidersHorizontal,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  History,
} from 'lucide-react';

export default function MovimientosInventarioPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [tipo, setTipo] = useState<TipoMovimiento>('ENTRADA');
  const [selectedVarianteId, setSelectedVarianteId] = useState('');
  const [ubicacionId, setUbicacionId] = useState('');
  const [ubicacionDestinoId, setUbicacionDestinoId] = useState('');
  const [cantidad, setCantidad] = useState(10);
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodsData, ubisData, movsData] = await Promise.all([
        api.getProductos(1, 100),
        api.getUbicaciones(),
        api.getMovimientos(1, 30),
      ]);

      setProductos(prodsData.items);
      setUbicaciones(ubisData);
      setMovimientos(movsData.items);

      // Auto-seleccionar primer SKU y primera ubicación si están vacíos
      if (prodsData.items.length > 0 && !selectedVarianteId) {
        const primerSku = prodsData.items[0].variantes?.[0]?.id;
        if (primerSku) setSelectedVarianteId(primerSku);
      }

      if (ubisData.length > 0 && !ubicacionId) {
        setUbicacionId(ubisData[0].id);
        if (ubisData.length > 1) {
          setUbicacionDestinoId(ubisData[1].id);
        }
      }
    } catch (err) {
      console.error('Error cargando datos de inventario:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmitMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!selectedVarianteId) {
      const msg = 'Por favor selecciona una prenda / SKU.';
      setFormError(msg);
      toast.warning(msg);
      return;
    }

    if (tipo === 'TRASLADO' && ubicacionId === ubicacionDestinoId) {
      const msg = 'La ubicación origen y destino deben ser distintas para un traslado.';
      setFormError(msg);
      toast.warning(msg);
      return;
    }

    if (tipo === 'AJUSTE' && !motivo.trim()) {
      const msg = 'El motivo es obligatorio para registrar un ajuste de inventario.';
      setFormError(msg);
      toast.warning(msg);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createMovimiento({
        varianteId: selectedVarianteId,
        ubicacionId,
        ubicacionDestinoId: tipo === 'TRASLADO' ? ubicacionDestinoId : undefined,
        tipo,
        cantidad: Number(cantidad),
        motivo: motivo.trim() || undefined,
      });

      const successMsg = res.deduplicated
        ? 'Operación detectada como duplicada (Idempotente). Saldo verificado.'
        : `¡Movimiento de ${tipo} (${cantidad} u.) registrado en el Ledger!`;

      setFormSuccess(successMsg);
      toast.success(successMsg, 'Ledger Actualizado');

      // Limpiar motivo y recargar historial
      setMotivo('');
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Error al registrar movimiento');
      toast.error(err.message || 'Error al registrar movimiento');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Consola de Movimientos Ledger
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Registra entradas, salidas, traslados y ajustes con garantía de idempotencia (ADR-003, ADR-004)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Formulario para Registrar Movimiento (5 cols en lg) */}
        <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl glass-card border-slate-800 space-y-6 shadow-2xl h-fit">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Plus className="w-5 h-5 text-sky-400" />
              <span>Nuevo Registro de Stock</span>
            </h2>
            <p className="text-xs text-slate-400">
              Afecta transaccionalmente el saldo materializado
            </p>
          </div>

          {formSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmitMovimiento} className="space-y-4">
            {/* Selector de Tipo de Movimiento */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Tipo de Operación
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'ENTRADA', label: 'Entrada', icon: ArrowDownLeft, color: 'text-emerald-400' },
                  { value: 'SALIDA', label: 'Salida', icon: ArrowUpRight, color: 'text-rose-400' },
                  { value: 'TRASLADO', label: 'Traslado', icon: ArrowRightLeft, color: 'text-amber-400' },
                  { value: 'AJUSTE', label: 'Ajuste', icon: SlidersHorizontal, color: 'text-purple-400' },
                ].map((t) => {
                  const Icon = t.icon;
                  const isSelected = tipo === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTipo(t.value as TipoMovimiento)}
                      className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
                        isSelected
                          ? 'bg-sky-500/20 text-white border-sky-400 shadow-md shadow-sky-500/10'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${t.color}`} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selección de SKU */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Prenda / Variante SKU *
              </label>
              <select
                value={selectedVarianteId}
                onChange={(e) => setSelectedVarianteId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-800 focus:border-sky-500 outline-none text-white font-mono"
              >
                {productos.map((p) =>
                  p.variantes?.map((v) => (
                    <option key={v.id} value={v.id}>
                      {p.nombre} — {v.skuCode} ({v.talla} / {v.color})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Ubicación Origen */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                {tipo === 'TRASLADO' ? 'Ubicación Origen *' : 'Ubicación de Almacén *'}
              </label>
              <select
                value={ubicacionId}
                onChange={(e) => setUbicacionId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-800 focus:border-sky-500 outline-none text-white"
              >
                {ubicaciones.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre} ({u.tipo})
                  </option>
                ))}
              </select>
            </div>

            {/* Ubicación Destino (solo para TRASLADO) */}
            {tipo === 'TRASLADO' && (
              <div className="space-y-1.5 animate-fadeIn">
                <label className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Ubicación Destino *
                </label>
                <select
                  value={ubicacionDestinoId}
                  onChange={(e) => setUbicacionDestinoId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-900 border border-amber-500/50 focus:border-amber-400 outline-none text-white"
                >
                  {ubicaciones.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre} ({u.tipo})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Cantidad */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Cantidad de Unidades *
              </label>
              <input
                type="number"
                min={1}
                required
                value={cantidad}
                onChange={(e) => setCantidad(parseInt(e.target.value, 10) || 1)}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-900 border border-slate-800 focus:border-sky-500 outline-none text-white"
              />
            </div>

            {/* Motivo (obligatorio para AJUSTE) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Motivo / Justificación {tipo === 'AJUSTE' && <span className="text-rose-400">*</span>}
              </label>
              <input
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder={tipo === 'AJUSTE' ? 'Obligatorio (ej: Conteo físico faltante)' : 'Opcional'}
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-800 focus:border-sky-500 outline-none text-white"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 mt-4"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registrando en ledger...</span>
                </>
              ) : (
                <span>Ejecutar Movimiento</span>
              )}
            </button>
          </form>
        </div>

        {/* Historial de Movimientos Ledger (7 cols en lg) */}
        <div className="lg:col-span-7 p-6 rounded-3xl glass-card border-slate-800 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <History className="w-4 h-4 text-sky-400" />
                <span>Auditoría de Movimientos</span>
              </h2>
              <p className="text-xs text-slate-400">
                Últimos registros inmutables ordenados por timestamp
              </p>
            </div>

            <span className="text-xs text-slate-500 font-mono">
              Total: {movimientos.length} eventos
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="py-3 px-3">Tipo</th>
                  <th className="py-3 px-3">SKU & Prenda</th>
                  <th className="py-3 px-3">Almacén</th>
                  <th className="py-3 px-3 text-right">Cant</th>
                  <th className="py-3 px-3">Usuario</th>
                  <th className="py-3 px-3">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {movimientos.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3">{getTipoBadge(m.tipo)}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-white block">
                        {m.variante?.producto?.nombre}
                      </span>
                      <span className="text-[11px] font-mono text-sky-300">
                        {m.variante?.skuCode} ({m.variante?.talla}/{m.variante?.color})
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      <span>{m.ubicacion?.nombre}</span>
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
                      <span>{m.usuario?.nombre}</span>
                      <span className="text-[10px] text-slate-500 block uppercase">
                        {m.usuario?.rol}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {new Date(m.timestamp).toLocaleTimeString('es-CO', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
