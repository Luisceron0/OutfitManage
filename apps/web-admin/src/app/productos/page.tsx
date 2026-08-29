'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useToast } from '../../lib/toast-context';
import { Producto, Categoria } from '../../types';
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
  CheckCircle2,
} from 'lucide-react';

export default function ProductosPage() {
  const toast = useToast();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal Crear Producto
  const [showModal, setShowModal] = useState(false);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [visiblePublico, setVisiblePublico] = useState(true);
  const [variantes, setVariantes] = useState<
    { skuCode: string; talla: string; color: string; precio: number | string; atributoOpcional?: string }[]
  >([
    { skuCode: '', talla: '', color: '', precio: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal Editar Producto
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editCategoriaId, setEditCategoriaId] = useState('');
  const [editVisiblePublico, setEditVisiblePublico] = useState(true);
  const [editVariantes, setEditVariantes] = useState<
    { id?: string; skuCode: string; talla: string; color: string; precio: number | string; atributoOpcional?: string }[]
  >([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Modal Eliminar Producto
  const [deletingProduct, setDeletingProduct] = useState<Producto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodsData, catsData] = await Promise.all([
        api.getProductos(1, 50),
        api.getCategorias(),
      ]);
      setProductos(prodsData.items);
      setCategorias(catsData);
      if (catsData.length > 0 && !categoriaId) {
        setCategoriaId(catsData[0].id);
      }
    } catch (err) {
      console.error('Error cargando productos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Funciones Form Crear ---
  const handleAddVariante = () => {
    setVariantes([
      ...variantes,
      { skuCode: '', talla: '', color: '', precio: '' },
    ]);
  };

  const handleRemoveVariante = (index: number) => {
    if (variantes.length <= 1) return;
    setVariantes(variantes.filter((_, i) => i !== index));
  };

  const handleVarianteChange = (index: number, field: string, value: any) => {
    const updated = [...variantes];
    updated[index] = { ...updated[index], [field]: value };
    setVariantes(updated);
  };

  const handleCreateProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const skusIncompletos = variantes.some((v) => !v.skuCode.trim());
    if (skusIncompletos) {
      setFormError('Por favor asigna un código SKU único a cada variante.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createProducto({
        nombre,
        descripcion,
        categoriaId,
        visiblePublico,
        variantes: variantes.map((v) => ({
          ...v,
          precio: Number(v.precio) || 0,
        })),
      });

      toast.success(`La prenda "${nombre}" y sus ${variantes.length} variantes fueron registradas.`, '¡Producto Creado!');
      setShowModal(false);
      setNombre('');
      setDescripcion('');
      setVariantes([{ skuCode: '', talla: '', color: '', precio: '' }]);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Error al crear producto');
      toast.error(err.message || 'Error al crear producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Funciones Form Editar ---
  const handleOpenEdit = (producto: Producto) => {
    setEditingProduct(producto);
    setEditNombre(producto.nombre);
    setEditDescripcion(producto.descripcion || '');
    setEditCategoriaId(producto.categoriaId);
    setEditVisiblePublico(producto.visiblePublico);

    const mappedVars = (producto.variantes || []).map((v) => {
      const activePrice = v.precios && v.precios.length > 0 ? Number(v.precios[0].precio) : '';
      return {
        id: v.id,
        skuCode: v.skuCode,
        talla: v.talla,
        color: v.color,
        precio: activePrice,
        atributoOpcional: v.atributoOpcional || undefined,
      };
    });

    setEditVariantes(
      mappedVars.length > 0
        ? mappedVars
        : [{ skuCode: '', talla: '', color: '', precio: '' }]
    );
    setEditError(null);
  };

  const handleAddEditVariante = () => {
    setEditVariantes([
      ...editVariantes,
      { skuCode: '', talla: '', color: '', precio: '' },
    ]);
  };

  const handleRemoveEditVariante = (index: number) => {
    if (editVariantes.length <= 1) return;
    setEditVariantes(editVariantes.filter((_, i) => i !== index));
  };

  const handleEditVarianteChange = (index: number, field: string, value: any) => {
    const updated = [...editVariantes];
    updated[index] = { ...updated[index], [field]: value };
    setEditVariantes(updated);
  };

  const handleUpdateProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setEditError(null);

    const skusIncompletos = editVariantes.some((v) => !v.skuCode.trim());
    if (skusIncompletos) {
      setEditError('Por favor asigna un código SKU a cada variante.');
      return;
    }

    setIsEditing(true);
    try {
      await api.updateProducto(editingProduct.id, {
        nombre: editNombre,
        descripcion: editDescripcion,
        categoriaId: editCategoriaId,
        visiblePublico: editVisiblePublico,
        variantes: editVariantes.map((v) => ({
          ...v,
          precio: Number(v.precio),
        })),
      });

      toast.success(`Prenda "${editNombre}" actualizada correctamente.`, '¡Cambios Guardados!');
      setEditingProduct(null);
      await loadData();
    } catch (err: any) {
      setEditError(err.message || 'Error al actualizar producto');
      toast.error(err.message || 'Error al actualizar producto');
    } finally {
      setIsEditing(false);
    }
  };

  // Toggle Rápido de Visibilidad
  const handleToggleVisibility = async (producto: Producto) => {
    const newStatus = !producto.visiblePublico;
    try {
      await api.updateProducto(producto.id, {
        visiblePublico: newStatus,
      });
      toast.info(
        `"${producto.nombre}" ahora está ${newStatus ? 'visible en vitrina pública' : 'oculto del catálogo'}.`,
        'Visibilidad Modificada'
      );
      await loadData();
    } catch (err) {
      console.error('Error cambiando visibilidad:', err);
      toast.error('No se pudo cambiar la visibilidad');
    }
  };

  // Confirmar y Ejecutar Eliminación en Modal
  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    setDeleteError(null);

    const nombreEliminado = deletingProduct.nombre;
    try {
      await api.deleteProducto(deletingProduct.id);
      toast.success(`El producto "${nombreEliminado}" fue eliminado del sistema.`, 'Producto Eliminado');
      setDeletingProduct(null);
      await loadData();
    } catch (err: any) {
      setDeleteError(err.message || 'Error al eliminar el producto.');
      toast.error(err.message || 'Error al eliminar el producto');
    } finally {
      setIsDeleting(false);
    }
  };

  const productosFiltrados = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.categoria?.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.variantes?.some((v) => v.skuCode.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Gestor de Productos & SKUs
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Administra prendas, edita datos de catálogo, variantes de talla/color y configura precios vigentes
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Producto & Variantes</span>
        </button>
      </div>

      {/* Barra de Búsqueda */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl glass-card border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, SKU o categoría..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-slate-900/90 border border-slate-800 focus:border-sky-500 outline-none text-white placeholder:text-slate-500"
          />
        </div>

        <span className="text-xs text-slate-400 font-semibold">
          Total: <strong className="text-white">{productosFiltrados.length}</strong> productos
        </span>
      </div>

      {/* Tabla de Productos */}
      <div className="rounded-3xl glass-card border-slate-800 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-sky-400 mb-3" />
            <span className="text-xs font-semibold uppercase">Cargando catálogo...</span>
          </div>
        ) : productosFiltrados.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="py-4 px-6">Producto</th>
                  <th className="py-4 px-6">Categoría</th>
                  <th className="py-4 px-6">Variantes / SKUs</th>
                  <th className="py-4 px-6">Visibilidad Catálogo</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {productosFiltrados.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
                          <Shirt className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-sm text-white block">
                            {prod.nombre}
                          </span>
                          {prod.descripcion && (
                            <span className="text-[11px] text-slate-400 line-clamp-1">
                              {prod.descripcion}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {prod.categoria?.nombre || 'General'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 flex-wrap">
                          {prod.variantes?.map((v) => (
                            <span
                              key={v.id}
                              className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-900 text-sky-300 border border-slate-700/60"
                            >
                              {v.skuCode} ({v.talla}/{v.color})
                            </span>
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          {prod.variantes?.length || 0} variante(s) activas
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggleVisibility(prod)}
                        title="Haz clic para alternar visibilidad"
                        className="cursor-pointer transition-transform hover:scale-105"
                      >
                        {prod.visiblePublico ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20">
                            <Eye className="w-3.5 h-3.5" /> Público
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700">
                            <EyeOff className="w-3.5 h-3.5" /> Oculto
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(prod)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/30 transition-all"
                          title="Editar producto y sus variantes SKU"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => setDeletingProduct(prod)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <Boxes className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm font-semibold">No se encontraron productos</p>
          </div>
        )}
      </div>

      {/* Modal Confirmar Eliminación */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl glass-card border-rose-500/30 p-6 sm:p-7 space-y-5 shadow-2xl bg-[#0f121d] text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-white">¿Eliminar Producto?</h3>
              <p className="text-xs text-slate-400">
                Estás a punto de eliminar <strong className="text-white">"{deletingProduct.nombre}"</strong>. Esta acción eliminará permanentemente la prenda y sus variantes asociadas.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingProduct(null)}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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

      {/* Modal Editar Producto & Variantes */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl glass-card border-slate-700 p-6 sm:p-8 space-y-6 shadow-2xl bg-[#0e1424]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-sky-400" />
                  <span>Editar Producto & Variantes (SKU)</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Modifica los datos generales, tallas, colores y precios vigentes
                </p>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdateProducto} className="space-y-6">
              {/* Información General */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Nombre de la Prenda *
                  </label>
                  <input
                    type="text"
                    required
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-900 border border-slate-800 focus:border-sky-500 outline-none text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Categoría *
                    </label>
                    <select
                      value={editCategoriaId}
                      onChange={(e) => setEditCategoriaId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-900 border border-slate-800 focus:border-sky-500 outline-none text-white"
                    >
                      {categorias.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Visibilidad en Catálogo Virtual
                    </label>
                    <div className="flex items-center gap-3 pt-2">
                      <input
                        type="checkbox"
                        id="editVisibleCheck"
                        checked={editVisiblePublico}
                        onChange={(e) => setEditVisiblePublico(e.target.checked)}
                        className="w-4 h-4 rounded text-sky-500 bg-slate-900 border-slate-700"
                      />
                      <label htmlFor="editVisibleCheck" className="text-xs text-slate-300 font-medium">
                        Mostrar en vitrina pública
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Descripción
                  </label>
                  <textarea
                    value={editDescripcion}
                    onChange={(e) => setEditDescripcion(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 rounded-xl text-sm bg-slate-900 border border-slate-800 focus:border-sky-500 outline-none text-white"
                  />
                </div>
              </div>

              {/* Variantes (SKUs) */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Variantes de Inventario (SKUs)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Gestiona las combinaciones de talla/color y ajusta sus precios vigentes
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddEditVariante}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Talla/Color</span>
                  </button>
                </div>

                {/* Encabezados de Columna */}
                <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 pt-1">
                  <div className="col-span-4">Código SKU *</div>
                  <div className="col-span-2">Talla *</div>
                  <div className="col-span-3">Color *</div>
                  <div className="col-span-2">Precio ($) *</div>
                  <div className="col-span-1 text-center"></div>
                </div>

                <div className="space-y-2.5">
                  {editVariantes.map((v, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center p-3 rounded-xl bg-slate-900/90 border border-slate-800"
                    >
                      <div className="col-span-4">
                        <input
                          type="text"
                          required
                          placeholder="Ej: JEA-AZU-L"
                          value={v.skuCode}
                          onChange={(e) => handleEditVarianteChange(idx, 'skuCode', e.target.value.toUpperCase())}
                          className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-950 border border-slate-700 text-sky-300 uppercase placeholder:text-slate-600"
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="text"
                          required
                          placeholder="L, M, 32"
                          value={v.talla}
                          onChange={(e) => handleEditVarianteChange(idx, 'talla', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-slate-950 border border-slate-700 text-white"
                        />
                      </div>

                      <div className="col-span-3">
                        <input
                          type="text"
                          required
                          placeholder="Color"
                          value={v.color}
                          onChange={(e) => handleEditVarianteChange(idx, 'color', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-slate-950 border border-slate-700 text-white"
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          required
                          min={0}
                          placeholder="50000"
                          value={v.precio}
                          onChange={(e) => handleEditVarianteChange(idx, 'precio', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono bg-slate-950 border border-slate-700 text-white"
                        />
                      </div>

                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          disabled={editVariantes.length <= 1}
                          onClick={() => handleRemoveEditVariante(idx)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 disabled:opacity-20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botones del Modal */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isEditing}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isEditing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Actualizando producto...</span>
                    </>
                  ) : (
                    <span>Guardar Cambios</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Crear Producto con Variantes */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl glass-card border-slate-700 p-6 sm:p-8 space-y-6 shadow-2xl bg-[#0e1424]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-white">Nuevo Producto & Variantes (SKU)</h2>
                <p className="text-xs text-slate-400">
                  Crea la prenda y define sus tallas, colores y precios vigentes
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateProducto} className="space-y-6">
              {/* Información General */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Nombre de la Prenda *
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Jean Slim Fit Azul"
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-900 border border-slate-800 focus:border-sky-500 outline-none text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Categoría *
                    </label>
                    <select
                      value={categoriaId}
                      onChange={(e) => setCategoriaId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-900 border border-slate-800 focus:border-sky-500 outline-none text-white"
                    >
                      {categorias.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Visibilidad en Catálogo Virtual
                    </label>
                    <div className="flex items-center gap-3 pt-2">
                      <input
                        type="checkbox"
                        id="visibleCheck"
                        checked={visiblePublico}
                        onChange={(e) => setVisiblePublico(e.target.checked)}
                        className="w-4 h-4 rounded text-sky-500 bg-slate-900 border-slate-700"
                      />
                      <label htmlFor="visibleCheck" className="text-xs text-slate-300 font-medium">
                        Mostrar en vitrina pública
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Descripción
                  </label>
                  <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    rows={2}
                    placeholder="Detalles sobre tela, horma, instrucciones de lavado..."
                    className="w-full px-4 py-2 rounded-xl text-sm bg-slate-900 border border-slate-800 focus:border-sky-500 outline-none text-white"
                  />
                </div>
              </div>

              {/* Variantes (SKUs) */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Variantes de Inventario (SKUs)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Cada variante representa una combinación única de stock y precio
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddVariante}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Talla/Color</span>
                  </button>
                </div>

                {/* Encabezados de Columna */}
                <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 pt-1">
                  <div className="col-span-4">Código SKU *</div>
                  <div className="col-span-2">Talla *</div>
                  <div className="col-span-3">Color *</div>
                  <div className="col-span-2">Precio ($) *</div>
                  <div className="col-span-1 text-center"></div>
                </div>

                <div className="space-y-2.5">
                  {variantes.map((v, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center p-3 rounded-xl bg-slate-900/90 border border-slate-800"
                    >
                      <div className="col-span-4">
                        <input
                          type="text"
                          required
                          placeholder="Ej: JEA-AZU-M"
                          value={v.skuCode}
                          onChange={(e) => handleVarianteChange(idx, 'skuCode', e.target.value.toUpperCase())}
                          className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-950 border border-slate-700 text-sky-300 uppercase placeholder:text-slate-600"
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="text"
                          required
                          placeholder="M, L, 32"
                          value={v.talla}
                          onChange={(e) => handleVarianteChange(idx, 'talla', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-slate-950 border border-slate-700 text-white"
                        />
                      </div>

                      <div className="col-span-3">
                        <input
                          type="text"
                          required
                          placeholder="Color"
                          value={v.color}
                          onChange={(e) => handleVarianteChange(idx, 'color', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-slate-950 border border-slate-700 text-white"
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          required
                          min={0}
                          placeholder="50000"
                          value={v.precio}
                          onChange={(e) => handleVarianteChange(idx, 'precio', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono bg-slate-950 border border-slate-700 text-white"
                        />
                      </div>

                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          disabled={variantes.length <= 1}
                          onClick={() => handleRemoveVariante(idx)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 disabled:opacity-20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botones del Modal */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando producto...</span>
                    </>
                  ) : (
                    <span>Guardar Producto</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
