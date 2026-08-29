'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Producto, Ubicacion } from '../../types';
import { Boxes, Search, Warehouse, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

export default function StockPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [selectedUbicacion, setSelectedUbicacion] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodsData, ubisData] = await Promise.all([
        api.getProductos(1, 100),
        api.getUbicaciones(),
      ]);
      setProductos(prodsData.items);
      setUbicaciones(ubisData);
    } catch (err) {
      console.error('Error cargando stock:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Aplanar variantes para la vista de inventario SKU
  const todasLasVariantes = productos.flatMap((p) =>
    (p.variantes || []).map((v) => ({
      ...v,
      productoNombre: p.nombre,
      categoriaNombre: p.categoria?.nombre,
    }))
  );

  const variantesFiltradas = todasLasVariantes.filter((v) => {
    const matchesSearch =
      v.skuCode.toLowerCase().includes(search.toLowerCase()) ||
      v.productoNombre.toLowerCase().includes(search.toLowerCase()) ||
      v.talla.toLowerCase().includes(search.toLowerCase()) ||
      v.color.toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Explorador de Stock & Saldos
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Consulta existencias físicas consolidadas y discriminadas por bodega/tienda (SRS 6.5)
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between p-4 rounded-2xl glass-card border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por SKU, prenda, talla o color..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-slate-900 border border-slate-800 focus:border-sky-500 outline-none text-white placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Warehouse className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedUbicacion}
            onChange={(e) => setSelectedUbicacion(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-800 text-white outline-none focus:border-sky-500"
          >
            <option value="ALL">Todas las Ubicaciones</option>
            {ubicaciones.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre} ({u.tipo})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de Existencias por SKU */}
      <div className="rounded-3xl glass-card border-slate-800 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-sky-400 mb-3" />
            <span className="text-xs font-semibold uppercase">Consultando saldos...</span>
          </div>
        ) : variantesFiltradas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="py-4 px-6">Código SKU</th>
                  <th className="py-4 px-6">Prenda / Modelo</th>
                  <th className="py-4 px-6">Talla & Color</th>
                  <th className="py-4 px-6">Existencias por Almacén</th>
                  <th className="py-4 px-6 text-right">Saldo Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {variantesFiltradas.map((v) => {
                  // Calcular saldo por ubicación y total
                  const saldosAplicables =
                    selectedUbicacion === 'ALL'
                      ? v.saldos || []
                      : (v.saldos || []).filter((s) => s.ubicacionId === selectedUbicacion);

                  const total = saldosAplicables.reduce((acc, s) => acc + s.cantidad, 0);

                  return (
                    <tr key={v.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6">
                        <span className="font-mono font-bold text-sky-400 text-sm">
                          {v.skuCode}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-bold text-white block text-sm">
                          {v.productoNombre}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {v.categoriaNombre || 'General'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            Talla: {v.talla}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            Color: {v.color}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {v.saldos && v.saldos.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {v.saldos.map((s) => (
                              <span
                                key={s.ubicacionId}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] bg-slate-900 border border-slate-800 text-slate-300"
                              >
                                <span className="font-semibold text-slate-400">{s.ubicacion.nombre}:</span>
                                <strong className="text-white font-mono">{s.cantidad}</strong>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">
                            Sin movimientos registrados (0)
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {total > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-mono font-extrabold text-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {total} u.
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-mono font-extrabold text-sm bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            0 u.
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <Boxes className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm font-semibold">No hay existencias que coincidan con la búsqueda</p>
          </div>
        )}
      </div>
    </div>
  );
}
