'use client';

import { useState, useEffect, useMemo } from 'react';
import { adminApi } from '../../../lib/admin-api';
import { Producto, Ubicacion } from '../../../types/admin';
import { Boxes, Search, Warehouse, Store, Loader2, Shirt, Sparkles, Building } from 'lucide-react';
import { Pagination } from '../../../components/ui/Pagination';

export default function AdminStockPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [selectedUbicacion, setSelectedUbicacion] = useState<string>('TODAS');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodsData, ubisData] = await Promise.all([
        adminApi.getProductos(1, 100),
        adminApi.getUbicaciones(),
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

  // Aplanar variantes con sus saldos
  const variantesConStock = useMemo(() => {
    return productos.flatMap((p) =>
      (p.variantes || []).map((v) => {
        const totalStock = (v.saldos || []).reduce((acc, s) => acc + s.cantidad, 0);
        const saldosFiltrados =
          selectedUbicacion === 'TODAS'
            ? v.saldos || []
            : (v.saldos || []).filter((s) => s.ubicacionId === selectedUbicacion);

        const stockUbicacion = saldosFiltrados.reduce((acc, s) => acc + s.cantidad, 0);

        return {
          id: v.id,
          productoNombre: p.nombre,
          categoria: p.categoria?.nombre || 'General',
          skuCode: v.skuCode,
          talla: v.talla,
          color: v.color,
          precio: v.precios?.[0]?.precio || 0,
          totalStock,
          stockUbicacion,
          saldos: v.saldos || [],
        };
      })
    );
  }, [productos, selectedUbicacion]);

  const variantesFiltradas = useMemo(() => {
    return variantesConStock.filter(
      (v) =>
        v.productoNombre.toLowerCase().includes(search.toLowerCase()) ||
        v.skuCode.toLowerCase().includes(search.toLowerCase()) ||
        v.categoria.toLowerCase().includes(search.toLowerCase())
    );
  }, [variantesConStock, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedUbicacion]);

  const totalPages = Math.ceil(variantesFiltradas.length / pageSize) || 1;
  const paginatedVariantes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return variantesFiltradas.slice(start, start + pageSize);
  }, [variantesFiltradas, currentPage, pageSize]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
            <Boxes className="w-3.5 h-3.5" />
            <span>Control Físico de Existencias</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Explorador de Stock Consolidado
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Consulta de existencias físicas disponibles discriminadas por SKU y sede en tiempo real.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por prenda, SKU o categoría..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all shadow-inner"
          />
        </div>

        {/* Selector de Ubicación */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
            Almacén / Sede:
          </span>
          <select
            value={selectedUbicacion}
            onChange={(e) => setSelectedUbicacion(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-sky-500 outline-none text-slate-900 dark:text-white w-full sm:w-auto cursor-pointer shadow-sm"
          >
            <option value="TODAS">Todas las ubicaciones</option>
            {ubicaciones.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre} ({u.tipo})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de Stock */}
      <div className="rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-sky-500 mb-3" />
            <span className="text-xs font-mono font-bold uppercase">Consultando saldos...</span>
          </div>
        ) : variantesFiltradas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase font-mono text-[10px] tracking-wider">
                  <th className="py-4 px-6 font-bold">SKU / Prenda</th>
                  <th className="py-4 px-6 font-bold">Talla &amp; Color</th>
                  <th className="py-4 px-6 font-bold">Categoría</th>
                  <th className="py-4 px-6 font-bold">Precio Vigente</th>
                  <th className="py-4 px-6 font-bold">Distribución por Ubicación</th>
                  <th className="py-4 px-6 text-right font-bold">Existencia Física</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {paginatedVariantes.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20 shrink-0">
                          <Shirt className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-sm text-slate-900 dark:text-white block">
                            {v.productoNombre}
                          </span>
                          <span className="font-mono text-sky-600 dark:text-sky-400 text-xs font-bold">
                            {v.skuCode}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-black text-slate-900 dark:text-white text-[11px]">
                          Talla: {v.talla}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold">
                          Color: {v.color}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                        {v.categoria}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      ${Number(v.precio).toLocaleString('es-CO')}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {v.saldos.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-xl text-[11px] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono flex items-center gap-1"
                          >
                            <span>{s.ubicacion.nombre}:</span>
                            <strong
                              className={
                                s.cantidad > 0 ? 'text-sky-600 dark:text-sky-400 font-black' : 'text-slate-400 dark:text-slate-600'
                              }
                            >
                              {s.cantidad} u.
                            </strong>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span
                        className={`text-base font-black font-mono ${
                          v.stockUbicacion > 5
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : v.stockUbicacion > 0
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-rose-500'
                        }`}
                      >
                        {v.stockUbicacion}{' '}
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                          u.
                        </span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-500 space-y-3">
            <Boxes className="w-8 h-8 mx-auto text-slate-400" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No se encontraron existencias registradas</p>
          </div>
        )}

        {/* Pagination Controls */}
        {variantesFiltradas.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={variantesFiltradas.length}
            itemsPerPage={pageSize}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
          />
        )}
      </div>
    </div>
  );
}
