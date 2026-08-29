"use client";

import { useState, useEffect, useMemo } from "react";
import { adminApi } from "../../../lib/admin-api";
import { useToast } from "../../../lib/toast-context";
import { Producto, Categoria, Ubicacion, TipoMovimiento } from "../../../types/admin";
import { ProductFormModal, VarianteFormItem } from "../../../components/admin/ProductFormModal";
import {
  Plus,
  Search,
  Shirt,
  Tag,
  Eye,
  EyeOff,
  Boxes,
  Loader2,
  X,
  Trash2,
  Edit2,
  AlertTriangle,
  PackagePlus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  SlidersHorizontal,
  CheckCircle2,
  Warehouse,
  Package,
  TrendingUp,
  Sparkles,
  Filter,
} from "lucide-react";
import { formatCurrency } from "../../../lib/api";
import { Pagination } from "../../../components/ui/Pagination";

export default function AdminProductosPage() {
  const toast = useToast();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("TODAS");
  const [stockStatusFilter, setStockStatusFilter] = useState<"TODOS" | "DISPONIBLE" | "AGOTADO" | "VISIBLES">("TODOS");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal Crear / Editar (Interactive ProductFormModal)
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Ajuste Rápido de Stock
  const [stockProduct, setStockProduct] = useState<Producto | null>(null);
  const [stockVarianteId, setStockVarianteId] = useState("");
  const [stockTipo, setStockTipo] = useState<TipoMovimiento>("ENTRADA");
  const [stockUbicacionId, setStockUbicacionId] = useState("");
  const [stockUbicacionDestinoId, setStockUbicacionDestinoId] = useState("");
  const [stockCantidad, setStockCantidad] = useState(10);
  const [stockMotivo, setStockMotivo] = useState("");
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);

  // Modal Eliminar Producto
  const [deletingProduct, setDeletingProduct] = useState<Producto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodsData, catsData, ubisData] = await Promise.all([
        adminApi.getProductos(1, 100),
        adminApi.getCategorias(),
        adminApi.getUbicaciones(),
      ]);
      setProductos(prodsData.items);
      setCategorias(catsData);
      setUbicaciones(ubisData);
    } catch (err) {
      console.error("Error cargando catálogo:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Submit Handler for Creation and Editing via ProductFormModal
  const handleProductSubmit = async (data: {
    nombre: string;
    descripcion: string;
    categoriaId: string;
    visiblePublico: boolean;
    ubicacionInicialId?: string;
    imagenes: string[];
    variantes: VarianteFormItem[];
  }) => {
    setIsSubmitting(true);
    try {
      if (editingProduct) {
        // Mode Update
        await adminApi.updateProducto(editingProduct.id, {
          nombre: data.nombre,
          descripcion: data.descripcion,
          categoriaId: data.categoriaId,
          visiblePublico: data.visiblePublico,
          imagenes: data.imagenes,
          variantes: data.variantes.map((v) => ({
            id: v.id,
            skuCode: v.skuCode,
            talla: v.talla,
            color: v.color,
            precio: Number(v.precio) || 0,
            imagenUrl: v.imagenUrl,
            imagenes: v.imagenes,
            atributoOpcional: v.atributoOpcional,
          })),
        });

        toast.success(`Prenda "${data.nombre}" actualizada con éxito.`, "¡Cambios Guardados!");
      } else {
        // Mode Create
        const nuevoProd = await adminApi.createProducto({
          nombre: data.nombre,
          descripcion: data.descripcion,
          categoriaId: data.categoriaId,
          visiblePublico: data.visiblePublico,
          imagenes: data.imagenes,
          variantes: data.variantes.map((v) => ({
            skuCode: v.skuCode,
            talla: v.talla,
            color: v.color,
            precio: Number(v.precio) || 0,
            imagenUrl: v.imagenUrl,
            imagenes: v.imagenes,
            atributoOpcional: v.atributoOpcional,
          })),
        });

        // Register initial stock if location selected
        if (data.ubicacionInicialId && nuevoProd.variantes) {
          for (const vForm of data.variantes) {
            const qty = Number(vForm.stockInicial);
            if (qty > 0) {
              const matchedVar = nuevoProd.variantes.find((nv) => nv.skuCode === vForm.skuCode);
              if (matchedVar) {
                await adminApi.createMovimiento({
                  varianteId: matchedVar.id,
                  ubicacionId: data.ubicacionInicialId,
                  tipo: "ENTRADA",
                  cantidad: qty,
                  motivo: "Stock inicial al crear producto",
                });
              }
            }
          }
        }

        toast.success(`Prenda "${data.nombre}" creada con sus variantes y stock inicial.`, "¡Prenda Registrada!");
      }

      setShowProductModal(false);
      setEditingProduct(null);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Error al procesar el producto");
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Funciones Modal Ajuste Rápido de Stock ---
  const handleOpenStockModal = (producto: Producto) => {
    setStockProduct(producto);
    setStockError(null);
    setStockMotivo("");
    setStockCantidad(10);
    setStockTipo("ENTRADA");

    if (producto.variantes && producto.variantes.length > 0) {
      setStockVarianteId(producto.variantes[0].id);
    }
    if (ubicaciones.length > 0) {
      setStockUbicacionId(ubicaciones[0].id);
      if (ubicaciones.length > 1) {
        setStockUbicacionDestinoId(ubicaciones[1].id);
      }
    }
  };

  const handleSubmitStockModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockVarianteId) {
      setStockError("Por favor selecciona una variante SKU.");
      return;
    }

    if (stockTipo === "TRASLADO" && stockUbicacionId === stockUbicacionDestinoId) {
      setStockError("La ubicación origen y destino deben ser distintas.");
      return;
    }

    setIsUpdatingStock(true);
    try {
      await adminApi.createMovimiento({
        varianteId: stockVarianteId,
        ubicacionId: stockUbicacionId,
        ubicacionDestinoId: stockTipo === "TRASLADO" ? stockUbicacionDestinoId : undefined,
        tipo: stockTipo,
        cantidad: Number(stockCantidad),
        motivo: stockMotivo.trim() || undefined,
      });

      toast.success(
        `Stock actualizado (${stockTipo} de ${stockCantidad} u.) exitosamente.`,
        "Stock Actualizado"
      );
      setStockProduct(null);
      await loadData();
    } catch (err: any) {
      setStockError(err.message || "Error al actualizar stock");
      toast.error(err.message || "Error al actualizar stock");
    } finally {
      setIsUpdatingStock(false);
    }
  };

  // Toggle Rápido de Visibilidad
  const handleToggleVisibility = async (producto: Producto) => {
    const newStatus = !producto.visiblePublico;
    try {
      await adminApi.updateProducto(producto.id, {
        visiblePublico: newStatus,
      });
      toast.info(
        `"${producto.nombre}" ahora está ${newStatus ? "visible en vitrina pública" : "oculto del catálogo"}.`,
        "Visibilidad Modificada"
      );
      await loadData();
    } catch (err) {
      console.error("Error cambiando visibilidad:", err);
      toast.error("No se pudo cambiar la visibilidad");
    }
  };

  // Confirmar y Ejecutar Eliminación en Modal
  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    setDeleteError(null);

    const nombreEliminado = deletingProduct.nombre;
    try {
      await adminApi.deleteProducto(deletingProduct.id);
      toast.success(`El producto "${nombreEliminado}" fue eliminado del sistema.`, "Producto Eliminado");
      setDeletingProduct(null);
      await loadData();
    } catch (err: any) {
      setDeleteError(err.message || "Error al eliminar el producto.");
      toast.error(err.message || "Error al eliminar el producto");
    } finally {
      setIsDeleting(false);
    }
  };

  const getProductoTotalStock = (prod: Producto) => {
    return (prod.variantes || []).reduce((totalAcc, v) => {
      const vStock = (v.saldos || []).reduce((acc, s) => acc + s.cantidad, 0);
      return totalAcc + vStock;
    }, 0);
  };

  // Total KPIs computations
  const totalStockGlobal = productos.reduce((sum, p) => sum + getProductoTotalStock(p), 0);
  const totalVisibles = productos.filter((p) => p.visiblePublico).length;
  const totalAgotados = productos.filter((p) => getProductoTotalStock(p) === 0).length;

  // Filtered Products
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      // Search
      const matchesSearch =
        p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        p.categoria?.nombre.toLowerCase().includes(search.toLowerCase()) ||
        p.variantes?.some((v) => v.skuCode.toLowerCase().includes(search.toLowerCase()));
      if (!matchesSearch) return false;

      // Category
      if (selectedCategoryFilter !== "TODAS" && p.categoriaId !== selectedCategoryFilter) {
        return false;
      }

      // Stock Status
      const totalStock = getProductoTotalStock(p);
      if (stockStatusFilter === "DISPONIBLE" && totalStock === 0) return false;
      if (stockStatusFilter === "AGOTADO" && totalStock > 0) return false;
      if (stockStatusFilter === "VISIBLES" && !p.visiblePublico) return false;

      return true;
    });
  }, [productos, search, selectedCategoryFilter, stockStatusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategoryFilter, stockStatusFilter]);

  const totalPages = Math.ceil(productosFiltrados.length / pageSize) || 1;
  const paginatedProductos = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return productosFiltrados.slice(start, start + pageSize);
  }, [productosFiltrados, currentPage, pageSize]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gestor de Prendas &amp; Inventario SKU</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Catálogo &amp; Control de Stock
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Crea prendas con tallas y colores automáticos, ajusta precios vigentes y administra el stock físico en tiempo real.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingProduct(null);
            setShowProductModal(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Registrar Prenda &amp; Tallas</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Total Modelos</span>
            <Shirt className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {productos.length}
          </div>
          <p className="text-[11px] text-slate-400 font-mono">Prendas en sistema</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Stock Global</span>
            <Boxes className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {totalStockGlobal} <span className="text-xs font-mono font-normal">u.</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">Unidades físicas activas</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Vitrina Web</span>
            <Eye className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400">
            {totalVisibles}
          </div>
          <p className="text-[11px] text-slate-400 font-mono">Visibles para compra</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Agotadas</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
            {totalAgotados}
          </div>
          <p className="text-[11px] text-slate-400 font-mono">Requieren restock</p>
        </div>
      </div>

      {/* Toolbar: Search + Category + Stock Status Filter */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
          {/* Search Input */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por prenda, SKU o tela..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 outline-none text-slate-900 dark:text-white"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2.5 rounded-2xl text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 outline-none text-slate-900 dark:text-white"
          >
            <option value="TODAS">Todas las Categorías</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>

          {/* Stock Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {(["TODOS", "DISPONIBLE", "AGOTADO", "VISIBLES"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStockStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  stockStatusFilter === status
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {status === "TODOS"
                  ? "Todos"
                  : status === "DISPONIBLE"
                  ? "En Stock"
                  : status === "AGOTADO"
                  ? "Agotados"
                  : "Visibles"}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono shrink-0">
          Mostrando <strong className="text-slate-900 dark:text-white">{productosFiltrados.length}</strong> de{" "}
          {productos.length} prendas
        </span>
      </div>

      {/* Table of Products */}
      <div className="rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">
              Cargando catálogo &amp; existencias...
            </span>
          </div>
        ) : productosFiltrados.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px] tracking-wider">
                <tr>
                  <th className="py-4 px-6 font-bold">Prenda / Modelo</th>
                  <th className="py-4 px-6 font-bold">Categoría</th>
                  <th className="py-4 px-6 font-bold">Variantes, Tallas &amp; Precios</th>
                  <th className="py-4 px-6 text-center font-bold">Stock Físico</th>
                  <th className="py-4 px-6 font-bold">Vitrina Web</th>
                  <th className="py-4 px-6 text-right font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {paginatedProductos.map((prod: Producto) => {
                  const totalStock = getProductoTotalStock(prod);

                  // Extract distinctive colors
                  const colors: string[] = Array.from(
                    new Set((prod.variantes || []).map((v) => v.color).filter(Boolean))
                  ) as string[];

                  return (
                    <tr
                      key={prod.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Prenda / Modelo */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-center">
                            {prod.imagenes && prod.imagenes.length > 0 ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={typeof prod.imagenes[0] === 'string' ? prod.imagenes[0] : (prod.imagenes[0] as any)?.url || (prod.imagenes[0] as any)?.ruta || ''}
                                alt={prod.nombre}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Shirt className="w-6 h-6 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-sm text-slate-900 dark:text-white block">
                              {prod.nombre}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {colors.map((c: string) => (
                                <span
                                  key={c}
                                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
                                >
                                  {c}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Categoría */}
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 font-mono">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {prod.categoria?.nombre || "Sin Categoría"}
                        </span>
                      </td>

                      {/* Variantes, Tallas & Precios */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 flex-wrap max-w-md">
                          {(prod.variantes || []).map((v) => {
                            const vStock = (v.saldos || []).reduce((acc: number, s: any) => acc + s.cantidad, 0);
                            const activePrice = v.precios?.[0]?.precio
                              ? Number(v.precios[0].precio)
                              : 0;

                            return (
                              <div
                                key={v.id}
                                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 text-[11px]"
                              >
                                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                  {v.skuCode}
                                </span>
                                <span className="text-slate-500 dark:text-slate-400">
                                  ({v.talla}/{v.color})
                                </span>
                                <span
                                  className={`font-mono font-bold px-1.5 py-0.5 rounded-md text-[10px] ${
                                    vStock > 5
                                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                      : vStock > 0
                                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                                      : "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                                  }`}
                                  title={`Stock disponible: ${vStock} u.`}
                                >
                                  {vStock}u
                                </span>
                                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                  {formatCurrency(activePrice)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Stock Total */}
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono ${
                            totalStock > 10
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                              : totalStock > 0
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                              : "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          <Boxes className="w-3.5 h-3.5" />
                          <span>{totalStock} u.</span>
                        </span>
                      </td>

                      {/* Vitrina Web (Visibility Toggle) */}
                      <td className="py-4 px-6">
                        <button
                          type="button"
                          onClick={() => handleToggleVisibility(prod)}
                          title="Haz clic para alternar visibilidad en catálogo público"
                          className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
                        >
                          {prod.visiblePublico ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                              <Eye className="w-3.5 h-3.5" /> Visible
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              <EyeOff className="w-3.5 h-3.5" /> Oculto
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenStockModal(prod)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all shadow-sm"
                            title="Ajustar o agregar stock físico"
                          >
                            <PackagePlus className="w-3.5 h-3.5" />
                            <span>Stock</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct(prod);
                              setShowProductModal(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all shadow-sm"
                            title="Editar prenda y variantes"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingProduct(prod)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={productosFiltrados.length}
              itemsPerPage={pageSize}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
            />
          </div>
        ) : (
          <div className="py-20 text-center text-slate-500 space-y-3">
            <Boxes className="w-10 h-10 mx-auto text-slate-400 opacity-60" />
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              No se encontraron prendas con estos filtros
            </p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategoryFilter("TODAS");
                setStockStatusFilter("TODOS");
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white"
            >
              Restablecer Filtros
            </button>
          </div>
        )}
      </div>

      {/* Interactive Modal: Crear o Editar Prenda */}
      <ProductFormModal
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setEditingProduct(null);
        }}
        onSubmit={handleProductSubmit}
        editingProduct={editingProduct}
        categorias={categorias}
        ubicaciones={ubicaciones}
        isSubmitting={isSubmitting}
      />

      {/* Modal Ajuste Rápido de Stock */}
      {stockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#0e1424] border border-slate-200 dark:border-slate-700 p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <PackagePlus className="w-5 h-5 text-emerald-500" />
                  <span>Gestionar Stock: {stockProduct.nombre}</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Agrega, retira o traslada existencias físicas para esta prenda
                </p>
              </div>
              <button
                onClick={() => setStockProduct(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {stockError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                {stockError}
              </div>
            )}

            <form onSubmit={handleSubmitStockModal} className="space-y-4">
              {/* Tipo de Operación */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                  Tipo de Operación *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStockTipo("ENTRADA")}
                    className={`p-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all border ${
                      stockTipo === "ENTRADA"
                        ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/50"
                        : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                    <span>Entrada (Restock)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStockTipo("SALIDA")}
                    className={`p-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all border ${
                      stockTipo === "SALIDA"
                        ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/50"
                        : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 text-rose-500" />
                    <span>Salida (Venta/Baja)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStockTipo("TRASLADO")}
                    className={`p-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all border ${
                      stockTipo === "TRASLADO"
                        ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/50"
                        : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <ArrowLeftRight className="w-4 h-4 text-amber-500" />
                    <span>Traslado entre Sedes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStockTipo("AJUSTE")}
                    className={`p-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all border ${
                      stockTipo === "AJUSTE"
                        ? "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/50"
                        : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <SlidersHorizontal className="w-4 h-4 text-purple-500" />
                    <span>Ajuste por Conteo</span>
                  </button>
                </div>
              </div>

              {/* Selector de Variante */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                  Variante SKU *
                </label>
                <select
                  required
                  value={stockVarianteId}
                  onChange={(e) => setStockVarianteId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-emerald-500 outline-none text-slate-900 dark:text-white font-medium"
                >
                  {stockProduct.variantes?.map((v) => {
                    const currentVStock = (v.saldos || []).reduce((acc, s) => acc + s.cantidad, 0);
                    return (
                      <option key={v.id} value={v.id}>
                        {v.skuCode} — Talla: {v.talla} | Color: {v.color} (Stock actual: {currentVStock} u.)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Ubicaciones y Cantidad */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                    {stockTipo === "TRASLADO" ? "Sede Origen *" : "Sede / Almacén *"}
                  </label>
                  <select
                    required
                    value={stockUbicacionId}
                    onChange={(e) => setStockUbicacionId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-emerald-500 outline-none text-slate-900 dark:text-white"
                  >
                    {ubicaciones.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre} ({u.tipo})
                      </option>
                    ))}
                  </select>
                </div>

                {stockTipo === "TRASLADO" ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                      Sede Destino *
                    </label>
                    <select
                      required
                      value={stockUbicacionDestinoId}
                      onChange={(e) => setStockUbicacionDestinoId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-emerald-500 outline-none text-slate-900 dark:text-white"
                    >
                      {ubicaciones.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nombre} ({u.tipo})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                      Cantidad *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={stockCantidad}
                      onChange={(e) => setStockCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-emerald-500 outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                )}

                {stockTipo === "TRASLADO" && (
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                      Cantidad a Trasladar *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={stockCantidad}
                      onChange={(e) => setStockCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-emerald-500 outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                )}
              </div>

              {/* Motivo */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                  Motivo / Observación
                </label>
                <input
                  type="text"
                  value={stockMotivo}
                  onChange={(e) => setStockMotivo(e.target.value)}
                  placeholder="Ej: Lote recibido proveedor, ajuste de inventario..."
                  className="w-full px-3.5 py-2.5 rounded-2xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-emerald-500 outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setStockProduct(null)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isUpdatingStock}
                  className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isUpdatingStock ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Actualizando stock...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Aplicar Stock</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#0f121d] border border-rose-500/30 p-6 sm:p-7 space-y-5 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-500">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">¿Eliminar Producto?</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Estás a punto de eliminar <strong className="text-slate-900 dark:text-white">"{deletingProduct.nombre}"</strong>. Esta acción eliminará la prenda, sus variantes y precios asociados.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingProduct(null)}
                className="flex-1 py-2.5 px-4 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 rounded-2xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Sí, eliminar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
