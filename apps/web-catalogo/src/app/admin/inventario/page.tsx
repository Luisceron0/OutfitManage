"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  Plus,
  Loader2,
  CheckCircle2,
  Boxes,
  Package,
  Search,
  X,
  History,
  Info,
  Warehouse,
  Store,
  RotateCcw,
  Check,
  AlertTriangle,
  Flame,
  Calendar,
  Layers,
} from "lucide-react";
import { adminApi } from "../../../lib/admin-api";
import { useAuth } from "../../../lib/auth-context";
import { useToast } from "../../../lib/toast-context";
import {
  Producto,
  Ubicacion,
  MovimientoInventario,
  TipoMovimiento,
} from "../../../types/admin";
import { ModalPortal } from "../../../components/ui/ModalPortal";
import { Pagination } from "../../../components/ui/Pagination";

export default function AdminInventarioPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<string>("TODOS");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [tipo, setTipo] = useState<TipoMovimiento>("ENTRADA");
  const [skuSearch, setSkuSearch] = useState("");
  const [selectedVarianteId, setSelectedVarianteId] = useState("");
  const [ubicacionId, setUbicacionId] = useState("");
  const [ubicacionDestinoId, setUbicacionDestinoId] = useState("");
  const [cantidad, setCantidad] = useState(10);
  const [motivo, setMotivo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Available operation types based on role (SRS RF-006)
  const allowedOperations: TipoMovimiento[] = useMemo(() => {
    if (user?.rol === "BODEGA") {
      return ["ENTRADA", "TRASLADO", "AJUSTE"];
    }
    if (user?.rol === "VENDEDOR") {
      return ["SALIDA", "DEVOLUCION"];
    }
    // ADMIN has all operations
    return ["ENTRADA", "SALIDA", "TRASLADO", "AJUSTE", "DEVOLUCION"];
  }, [user?.rol]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodsData, ubisData, movsData] = await Promise.all([
        adminApi.getProductos(1, 100),
        adminApi.getUbicaciones(),
        adminApi.getMovimientos(1, 50, tipoFiltro),
      ]);

      setProductos(prodsData.items || []);
      setUbicaciones(ubisData || []);
      setMovimientos(movsData.items || []);

      // Auto-select defaults
      if (prodsData.items?.length > 0 && !selectedVarianteId) {
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
      console.error("Error cargando datos de inventario:", err);
      toast.error("Error al cargar movimientos de inventario.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tipoFiltro]);

  const handleOpenModalWithTipo = (tipoOp: TipoMovimiento) => {
    setFormError(null);
    setTipo(tipoOp);
    setSkuSearch("");
    setMotivo(
      tipoOp === "ENTRADA"
        ? "Recepción de lote de compras / producción"
        : tipoOp === "TRASLADO"
        ? "Traslado inter-sede para reposición"
        : tipoOp === "AJUSTE"
        ? "Ajuste por conteo físico / auditoría"
        : tipoOp === "DEVOLUCION"
        ? "Devolución / cambio de prenda"
        : "Salida por venta"
    );
    setCantidad(10);
    setShowModal(true);
  };

  // Flatten variants with stock information for quick selector
  const variantesOptions = useMemo(() => {
    return productos.flatMap((prod) =>
      (prod.variantes || []).map((v) => {
        const totalStock = (v.saldos || []).reduce((acc, s) => acc + s.cantidad, 0);
        return {
          id: v.id,
          label: `${prod.nombre} — ${v.color} (Talla ${v.talla}) [SKU: ${v.skuCode}]`,
          productoNombre: prod.nombre,
          talla: v.talla,
          color: v.color,
          skuCode: v.skuCode,
          totalStock,
          saldos: v.saldos || [],
        };
      })
    );
  }, [productos]);

  const selectedVarianteObj = useMemo(() => {
    return variantesOptions.find((v) => v.id === selectedVarianteId) || null;
  }, [variantesOptions, selectedVarianteId]);

  // Current stock in origin and destination
  const stockEnOrigen = useMemo(() => {
    if (!selectedVarianteObj || !ubicacionId) return 0;
    const match = selectedVarianteObj.saldos.find((s) => s.ubicacionId === ubicacionId);
    return match ? match.cantidad : 0;
  }, [selectedVarianteObj, ubicacionId]);

  const stockEnDestino = useMemo(() => {
    if (!selectedVarianteObj || !ubicacionDestinoId) return 0;
    const match = selectedVarianteObj.saldos.find((s) => s.ubicacionId === ubicacionDestinoId);
    return match ? match.cantidad : 0;
  }, [selectedVarianteObj, ubicacionDestinoId]);

  // Filtered variants for the modal search
  const filteredVariantes = useMemo(() => {
    if (!skuSearch.trim()) return variantesOptions.slice(0, 30);
    const term = skuSearch.toLowerCase();
    return variantesOptions.filter(
      (v) =>
        v.label.toLowerCase().includes(term) ||
        v.skuCode.toLowerCase().includes(term) ||
        v.productoNombre.toLowerCase().includes(term)
    );
  }, [variantesOptions, skuSearch]);

  const handleSubmitMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedVarianteId) {
      const msg = "Por favor selecciona una prenda / SKU.";
      setFormError(msg);
      toast.warning(msg);
      return;
    }

    if (!ubicacionId) {
      const msg = "Por favor selecciona una sede de origen/almacén.";
      setFormError(msg);
      toast.warning(msg);
      return;
    }

    if (tipo === "TRASLADO" && (!ubicacionDestinoId || ubicacionId === ubicacionDestinoId)) {
      const msg = "En traslados, la sede origen y destino deben ser distintas.";
      setFormError(msg);
      toast.warning(msg);
      return;
    }

    if ((tipo === "AJUSTE" || tipo === "DEVOLUCION") && !motivo.trim()) {
      const msg = `El motivo es obligatorio para operaciones de ${tipo}.`;
      setFormError(msg);
      toast.warning(msg);
      return;
    }

    if ((tipo === "SALIDA" || tipo === "TRASLADO") && stockEnOrigen < cantidad) {
      const ubiName = ubicaciones.find((u) => u.id === ubicacionId)?.nombre || "la sede origen";
      const msg = `Stock insuficiente en ${ubiName}. Disponible: ${stockEnOrigen} u., Solicitado: ${cantidad} u.`;
      setFormError(msg);
      toast.warning(msg, "Stock Insuficiente");
      return;
    }

    setIsSubmitting(true);
    try {
      const resp = await adminApi.createMovimiento({
        varianteId: selectedVarianteId,
        ubicacionId,
        ubicacionDestinoId: tipo === "TRASLADO" ? ubicacionDestinoId : undefined,
        tipo,
        cantidad: Number(cantidad),
        motivo: motivo.trim() || undefined,
      });

      const ubiName = ubicaciones.find((u) => u.id === ubicacionId)?.nombre || "la sede";
      const successMsg = resp.deduplicated
        ? "Operación detectada como duplicada (Idempotente). Saldo verificado correctamente."
        : `¡Movimiento de ${tipo} (${cantidad} u.) registrado exitosamente en ${ubiName}!`;

      toast.success(successMsg, "Operación de Inventario Exitosa");
      setShowModal(false);
      setMotivo("");
      await loadData();
    } catch (err: any) {
      const errorMsg = err.message || "Error al registrar movimiento";
      setFormError(errorMsg);
      toast.error(errorMsg, "No se pudo registrar la operación");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case "ENTRADA":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <ArrowDownLeft className="w-3.5 h-3.5" /> Entrada
          </span>
        );
      case "SALIDA":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <ArrowUpRight className="w-3.5 h-3.5" /> Salida
          </span>
        );
      case "TRASLADO":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <ArrowLeftRight className="w-3.5 h-3.5" /> Traslado
          </span>
        );
      case "AJUSTE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Ajuste Físico
          </span>
        );
      case "DEVOLUCION":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <RotateCcw className="w-3.5 h-3.5" /> Devolución
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            {tipo}
          </span>
        );
    }
  };

  // Filter movements
  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter((m) => {
      const matchSearch =
        (m.variante?.producto?.nombre || "").toLowerCase().includes(search.toLowerCase()) ||
        (m.variante?.skuCode || "").toLowerCase().includes(search.toLowerCase()) ||
        (m.ubicacion?.nombre || "").toLowerCase().includes(search.toLowerCase()) ||
        (m.motivo || "").toLowerCase().includes(search.toLowerCase());

      const matchTipo = tipoFiltro === "TODOS" || m.tipo === tipoFiltro;
      return matchSearch && matchTipo;
    });
  }, [movimientos, search, tipoFiltro]);

  // Reset page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, tipoFiltro]);

  const totalPages = Math.ceil(movimientosFiltrados.length / pageSize) || 1;
  const paginatedMovimientos = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return movimientosFiltrados.slice(start, start + pageSize);
  }, [movimientosFiltrados, currentPage, pageSize]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-sm shrink-0">
              <Warehouse className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex flex-wrap items-center gap-2">
                <span>Centro de Operaciones de Inventario &amp; Kardex</span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                  {user?.rol || "ADMIN"}
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Auditoría append-only inmutable de compras, traslados entre sedes y ajustes físicos.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Operation Triggers */}
        <div className="flex items-center gap-2 flex-wrap">
          {(user?.rol === "ADMIN" || user?.rol === "BODEGA") && (
            <>
              <button
                type="button"
                onClick={() => handleOpenModalWithTipo("ENTRADA")}
                className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Recepción (Entrada)</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenModalWithTipo("TRASLADO")}
                className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>Traslado Inter-Sede</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenModalWithTipo("AJUSTE")}
                className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Ajuste / Auditoría</span>
              </button>
            </>
          )}

          {user?.rol === "VENDEDOR" && (
            <button
              type="button"
              onClick={() => handleOpenModalWithTipo("DEVOLUCION")}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Registrar Devolución</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por prenda, SKU, sede o motivo..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 focus:border-sky-500 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
            Filtrar tipo:
          </span>
          <select
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
            className="px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-sky-500 outline-none text-slate-900 dark:text-white w-full sm:w-auto font-bold"
          >
            <option value="TODOS">Todos los tipos</option>
            <option value="ENTRADA">Entrada (Compras/Recepción)</option>
            <option value="SALIDA">Salida (Ventas)</option>
            <option value="TRASLADO">Traslado</option>
            <option value="AJUSTE">Ajuste Físico</option>
            <option value="DEVOLUCION">Devolución / Cambio</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-sky-500 mb-3" />
            <span className="text-xs font-semibold uppercase font-mono">
              Cargando historial de auditoría...
            </span>
          </div>
        ) : movimientosFiltrados.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase font-mono text-[10px] tracking-wider">
                  <tr>
                    <th className="py-4 px-6 font-bold">Tipo</th>
                    <th className="py-4 px-6 font-bold">Prenda &amp; SKU</th>
                    <th className="py-4 px-6 font-bold">Sede Origen / Destino</th>
                    <th className="py-4 px-6 font-bold text-right">Cantidad</th>
                    <th className="py-4 px-6 font-bold">Motivo / Detalle</th>
                    <th className="py-4 px-6 font-bold">Autor</th>
                    <th className="py-4 px-6 font-bold text-right">Fecha &amp; Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {paginatedMovimientos.map((m) => (
                    <tr
                      key={m.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-4 px-6 whitespace-nowrap">{getTipoBadge(m.tipo)}</td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-900 dark:text-white block text-[11px]">
                          {m.variante?.skuCode}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {m.variante?.producto?.nombre} ({m.variante?.talla}/{m.variante?.color})
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="text-slate-800 dark:text-slate-200 font-medium block">
                          {m.ubicacion?.nombre || "—"}
                        </span>
                        {m.ubicacionDestino && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">
                            → Destino: {m.ubicacionDestino.nombre}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-right font-mono font-bold text-slate-900 dark:text-white text-sm">
                        {m.tipo === "SALIDA" || m.tipo === "TRASLADO"
                          ? `-${m.cantidad}`
                          : `+${m.cantidad}`}
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-slate-600 dark:text-slate-400 text-xs italic block max-w-xs truncate">
                          {m.motivo || "—"}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                        {m.usuario?.nombre || "Sistema"} ({m.usuario?.rol || "ADMIN"})
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-right text-slate-500 font-mono text-[11px]">
                        {new Date(m.timestamp).toLocaleString("es-CO", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={movimientosFiltrados.length}
              itemsPerPage={pageSize}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
            />
          </>
        ) : (
          <div className="py-16 text-center text-slate-500 space-y-3">
            <Boxes className="w-8 h-8 mx-auto text-slate-400" />
            <p className="text-sm font-semibold">No se encontraron movimientos registrados</p>
          </div>
        )}
      </div>

      {/* Unified Operation Modal */}
      {showModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#0e1424] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-5 shadow-2xl my-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Registrar Movimiento:</span>
                    <span className="text-sky-500 font-mono">{tipo}</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Actualiza el inventario físico con trazabilidad inmutable
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitMovimiento} className="space-y-4">
                {/* Operation Type Selector Buttons */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                    Tipo de Operación:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {allowedOperations.map((op) => (
                      <button
                        key={op}
                        type="button"
                        onClick={() => {
                          setTipo(op);
                          setFormError(null);
                        }}
                        className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                          tipo === op
                            ? "bg-sky-500/15 border-sky-500 text-sky-600 dark:text-sky-400 shadow-sm"
                            : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                        }`}
                      >
                        {op === "ENTRADA" && <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />}
                        {op === "SALIDA" && <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />}
                        {op === "AJUSTE" && <SlidersHorizontal className="w-3.5 h-3.5 text-sky-500" />}
                        {op === "TRASLADO" && <ArrowLeftRight className="w-3.5 h-3.5 text-amber-500" />}
                        {op === "DEVOLUCION" && <RotateCcw className="w-3.5 h-3.5 text-purple-500" />}
                        <span>{op}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* SKU Search / Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                    Variante / SKU *:
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar por SKU, prenda o color..."
                      value={skuSearch}
                      onChange={(e) => setSkuSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-sky-500 outline-none text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Dropdown list of filtered variants */}
                  <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-900 bg-slate-50/50 dark:bg-slate-900/30">
                    {filteredVariantes.length === 0 ? (
                      <p className="p-3 text-xs text-slate-400 text-center">No se encontraron prendas</p>
                    ) : (
                      filteredVariantes.map((v) => {
                        const isSelected = selectedVarianteId === v.id;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => {
                              setSelectedVarianteId(v.id);
                              setSkuSearch(`${v.skuCode} - ${v.productoNombre}`);
                            }}
                            className={`w-full p-2.5 text-left text-xs flex items-center justify-between transition-colors ${
                              isSelected
                                ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold"
                                : "hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            <div>
                              <span className="font-mono font-bold">{v.skuCode}</span>
                              <span className="ml-2 text-slate-500">
                                {v.productoNombre} ({v.color} / Talla {v.talla})
                              </span>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-sky-500" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Sede Origen */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                    {tipo === "TRASLADO" ? "Sede de Origen *:" : "Sede / Almacén *:"}
                  </label>
                  <select
                    value={ubicacionId}
                    onChange={(e) => setUbicacionId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
                  >
                    {ubicaciones.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre} ({u.tipo})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sede Destino (Solo para TRASLADO) */}
                {tipo === "TRASLADO" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider font-mono">
                      Sede de Destino *:
                    </label>
                    <select
                      value={ubicacionDestinoId}
                      onChange={(e) => setUbicacionDestinoId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-amber-500/40 text-slate-900 dark:text-white"
                    >
                      <option value="">Selecciona la sede destino...</option>
                      {ubicaciones
                        .filter((u) => u.id !== ubicacionId)
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.nombre} ({u.tipo})
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Cantidad */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                    Cantidad (Unidades) *:
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={cantidad}
                    onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                    placeholder="Ej: 10"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono font-bold bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Motivo Obligatorio */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                    Motivo / Observación {tipo === "AJUSTE" || tipo === "DEVOLUCION" ? "*" : ""}:
                  </label>
                  <input
                    type="text"
                    required={tipo === "AJUSTE" || tipo === "DEVOLUCION"}
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder={
                      tipo === "AJUSTE"
                        ? "Obligatorio: Ej. Conteo físico anual / Merma por daño"
                        : "Ej: Recepción proveedor Lote #144"
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>Confirmar Movimiento</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
