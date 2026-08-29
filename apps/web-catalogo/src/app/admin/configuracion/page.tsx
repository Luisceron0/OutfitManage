'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '../../../lib/admin-api';
import { useToast } from '../../../lib/toast-context';
import { Ubicacion, Categoria } from '../../../types/admin';
import { ModalPortal } from '../../../components/ui/ModalPortal';
import {
  Warehouse,
  FolderTree,
  Plus,
  Loader2,
  CheckCircle2,
  Building,
  Store,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
} from 'lucide-react';

export default function AdminConfiguracionPage() {
  const toast = useToast();
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Modales Ubicación ---
  const [showCreateUbicacion, setShowCreateUbicacion] = useState(false);
  const [editingUbicacion, setEditingUbicacion] = useState<Ubicacion | null>(null);
  const [deletingUbicacion, setDeletingUbicacion] = useState<Ubicacion | null>(null);

  // State Form Ubicación
  const [nombreUbicacion, setNombreUbicacion] = useState('');
  const [tipoUbicacion, setTipoUbicacion] = useState<'BODEGA' | 'TIENDA'>('TIENDA');
  const [direccionUbicacion, setDireccionUbicacion] = useState('');
  const [submittingUbicacion, setSubmittingUbicacion] = useState(false);
  const [errorUbicacion, setErrorUbicacion] = useState<string | null>(null);

  // --- Modales Categoría ---
  const [showCreateCategoria, setShowCreateCategoria] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [deletingCategoria, setDeletingCategoria] = useState<Categoria | null>(null);

  // State Form Categoría
  const [nombreCategoria, setNombreCategoria] = useState('');
  const [descripcionCategoria, setDescripcionCategoria] = useState('');
  const [submittingCategoria, setSubmittingCategoria] = useState(false);
  const [errorCategoria, setErrorCategoria] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ubis, cats] = await Promise.all([
        adminApi.getUbicaciones(),
        adminApi.getCategorias(),
      ]);
      setUbicaciones(ubis);
      setCategorias(cats);
    } catch (err) {
      console.error('Error cargando configuración:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Handlers Ubicaciones ---
  const handleOpenCreateUbicacion = () => {
    setNombreUbicacion('');
    setTipoUbicacion('TIENDA');
    setDireccionUbicacion('');
    setErrorUbicacion(null);
    setShowCreateUbicacion(true);
  };

  const handleOpenEditUbicacion = (u: Ubicacion) => {
    setEditingUbicacion(u);
    setNombreUbicacion(u.nombre);
    setTipoUbicacion(u.tipo);
    setDireccionUbicacion(u.direccion || '');
    setErrorUbicacion(null);
  };

  const handleCreateUbicacion = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorUbicacion(null);
    setSubmittingUbicacion(true);
    try {
      await adminApi.createUbicacion({
        nombre: nombreUbicacion,
        tipo: tipoUbicacion,
        direccion: direccionUbicacion.trim() || undefined,
      });
      toast.success(`La sede "${nombreUbicacion}" (${tipoUbicacion}) fue creada.`, 'Sede Registrada');
      setShowCreateUbicacion(false);
      await loadData();
    } catch (err: any) {
      setErrorUbicacion(err.message || 'Error al crear la sede');
      toast.error(err.message || 'Error al crear la sede');
    } finally {
      setSubmittingUbicacion(false);
    }
  };

  const handleUpdateUbicacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUbicacion) return;
    setErrorUbicacion(null);
    setSubmittingUbicacion(true);
    try {
      await adminApi.updateUbicacion(editingUbicacion.id, {
        nombre: nombreUbicacion,
        tipo: tipoUbicacion,
        direccion: direccionUbicacion.trim() || undefined,
      });
      toast.success(`La sede "${nombreUbicacion}" fue actualizada.`, 'Sede Actualizada');
      setEditingUbicacion(null);
      await loadData();
    } catch (err: any) {
      setErrorUbicacion(err.message || 'Error al actualizar sede');
      toast.error(err.message || 'Error al actualizar sede');
    } finally {
      setSubmittingUbicacion(false);
    }
  };

  const handleConfirmDeleteUbicacion = async () => {
    if (!deletingUbicacion) return;
    setSubmittingUbicacion(true);
    setErrorUbicacion(null);
    const nombre = deletingUbicacion.nombre;
    try {
      await adminApi.deleteUbicacion(deletingUbicacion.id);
      toast.success(`La sede "${nombre}" fue eliminada correctamente.`, 'Sede Eliminada');
      setDeletingUbicacion(null);
      await loadData();
    } catch (err: any) {
      setErrorUbicacion(err.message || 'No se puede eliminar la sede porque tiene stock asignado.');
      toast.error(err.message || 'Error al eliminar sede');
    } finally {
      setSubmittingUbicacion(false);
    }
  };

  // --- Handlers Categorías ---
  const handleOpenCreateCategoria = () => {
    setNombreCategoria('');
    setDescripcionCategoria('');
    setErrorCategoria(null);
    setShowCreateCategoria(true);
  };

  const handleOpenEditCategoria = (c: Categoria) => {
    setEditingCategoria(c);
    setNombreCategoria(c.nombre);
    setDescripcionCategoria(c.descripcion || '');
    setErrorCategoria(null);
  };

  const handleCreateCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorCategoria(null);
    setSubmittingCategoria(true);
    try {
      await adminApi.createCategoria({
        nombre: nombreCategoria,
        descripcion: descripcionCategoria.trim() || undefined,
      });
      toast.success(`Categoría "${nombreCategoria}" creada exitosamente.`, 'Categoría Creada');
      setShowCreateCategoria(false);
      await loadData();
    } catch (err: any) {
      setErrorCategoria(err.message || 'Error al crear la categoría');
      toast.error(err.message || 'Error al crear la categoría');
    } finally {
      setSubmittingCategoria(false);
    }
  };

  const handleUpdateCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategoria) return;
    setErrorCategoria(null);
    setSubmittingCategoria(true);
    try {
      await adminApi.updateCategoria(editingCategoria.id, {
        nombre: nombreCategoria,
        descripcion: descripcionCategoria.trim() || undefined,
      });
      toast.success(`Categoría "${nombreCategoria}" actualizada.`, 'Categoría Actualizada');
      setEditingCategoria(null);
      await loadData();
    } catch (err: any) {
      setErrorCategoria(err.message || 'Error al actualizar categoría');
      toast.error(err.message || 'Error al actualizar categoría');
    } finally {
      setSubmittingCategoria(false);
    }
  };

  const handleConfirmDeleteCategoria = async () => {
    if (!deletingCategoria) return;
    setSubmittingCategoria(true);
    setErrorCategoria(null);
    const nombre = deletingCategoria.nombre;
    try {
      await adminApi.deleteCategoria(deletingCategoria.id);
      toast.success(`La categoría "${nombre}" fue eliminada.`, 'Categoría Eliminada');
      setDeletingCategoria(null);
      await loadData();
    } catch (err: any) {
      setErrorCategoria(err.message || 'No se puede eliminar la categoría porque tiene productos asignados.');
      toast.error(err.message || 'Error al eliminar categoría');
    } finally {
      setSubmittingCategoria(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500 mb-3" />
        <span className="text-xs font-semibold uppercase font-mono">Cargando configuración...</span>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Almacenes, Sedes & Categorías
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Configuración estructural de sedes físicas para distribución de inventario y taxonomía del catálogo
        </p>
      </div>

      {/* SECCIÓN 1: Sedes y Almacenes */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20">
              <Warehouse className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Sedes Físicas & Puntos de Venta
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ubicaciones habilitadas para recepción, venta y custodia de prendas
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenCreateUbicacion}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white shadow-md shadow-sky-500/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Nueva Sede</span>
          </button>
        </div>

        {/* Grid de Sedes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {ubicaciones.map((u) => (
            <div
              key={u.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4 hover:border-sky-500/40 transition-all shadow-sm group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    {u.tipo === 'BODEGA' ? (
                      <Building className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <Store className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{u.nombre}</h3>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider mt-0.5 ${
                        u.tipo === 'BODEGA'
                          ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20'
                          : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {u.tipo}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenEditUbicacion(u)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Editar Sede"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingUbicacion(u)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Eliminar Sede"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {u.direccion ? (
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                  <strong className="text-slate-700 dark:text-slate-300">Dirección:</strong> {u.direccion}
                </p>
              ) : (
                <p className="text-xs text-slate-400 italic">Sin dirección física especificada</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SECCIÓN 2: Categorías de Prendas */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <FolderTree className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Categorías de Prendas
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Clasificación de productos visibles en catálogo y organizador de inventario
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenCreateCategoria}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Nueva Categoría</span>
          </button>
        </div>

        {/* Grid de Categorías */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {categorias.map((c) => (
            <div
              key={c.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3 hover:border-indigo-500/40 transition-all shadow-sm group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white block">{c.nombre}</span>
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEditCategoria(c)}
                      className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Editar Categoría"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingCategoria(c)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Eliminar Categoría"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-2">
                  {c.descripcion || 'Sin descripción detallada.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Estado:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Activa</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: Crear Sede */}
      {showCreateUbicacion && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#0e1424] border border-slate-200 dark:border-slate-700 p-6 sm:p-7 space-y-5 shadow-2xl my-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Nueva Sede / Almacén</h2>
                <button
                  onClick={() => setShowCreateUbicacion(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorUbicacion && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                  {errorUbicacion}
                </div>
              )}

              <form onSubmit={handleCreateUbicacion} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                    Nombre de la Sede *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Tienda Centro Comercial"
                    value={nombreUbicacion}
                    onChange={(e) => setNombreUbicacion(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-sky-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                    Tipo de Ubicación *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTipoUbicacion('TIENDA')}
                      className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                        tipoUbicacion === 'TIENDA'
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <Store className="w-4 h-4 text-emerald-500" />
                      <span>Tienda Física</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTipoUbicacion('BODEGA')}
                      className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                        tipoUbicacion === 'BODEGA'
                          ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/50'
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <Building className="w-4 h-4 text-indigo-500" />
                      <span>Bodega Principal</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                    Dirección
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Carrera 15 # 85-30 Local 102"
                    value={direccionUbicacion}
                    onChange={(e) => setDireccionUbicacion(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-sky-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateUbicacion(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingUbicacion}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {submittingUbicacion ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Sede'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL: Editar Sede */}
      {editingUbicacion && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#0e1424] border border-slate-200 dark:border-slate-700 p-6 sm:p-7 space-y-5 shadow-2xl my-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Editar Sede</h2>
                <button
                  onClick={() => setEditingUbicacion(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorUbicacion && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                  {errorUbicacion}
                </div>
              )}

              <form onSubmit={handleUpdateUbicacion} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                    Nombre de la Sede *
                  </label>
                  <input
                    type="text"
                    required
                    value={nombreUbicacion}
                    onChange={(e) => setNombreUbicacion(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-sky-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                    Tipo de Ubicación *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTipoUbicacion('TIENDA')}
                      className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                        tipoUbicacion === 'TIENDA'
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <Store className="w-4 h-4 text-emerald-500" />
                      <span>Tienda Física</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTipoUbicacion('BODEGA')}
                      className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                        tipoUbicacion === 'BODEGA'
                          ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/50'
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <Building className="w-4 h-4 text-indigo-500" />
                      <span>Bodega Principal</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={direccionUbicacion}
                    onChange={(e) => setDireccionUbicacion(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-sky-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingUbicacion(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingUbicacion}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {submittingUbicacion ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL: Confirmar Eliminar Sede */}
      {deletingUbicacion && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#0f121d] border border-rose-500/30 p-6 space-y-4 shadow-2xl text-center my-auto">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-500">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">¿Eliminar Sede?</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  ¿Seguro que deseas eliminar la sede <strong>"{deletingUbicacion.nombre}"</strong>?
                </p>
              </div>
              {errorUbicacion && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                  {errorUbicacion}
                </div>
              )}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingUbicacion(null)}
                  className="flex-1 py-2 px-4 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={submittingUbicacion}
                  onClick={handleConfirmDeleteUbicacion}
                  className="flex-1 py-2 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md"
                >
                  {submittingUbicacion ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL: Crear Categoría */}
      {showCreateCategoria && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#0e1424] border border-slate-200 dark:border-slate-700 p-6 sm:p-7 space-y-5 shadow-2xl my-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Nueva Categoría de Prendas</h2>
                <button
                  onClick={() => setShowCreateCategoria(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorCategoria && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                  {errorCategoria}
                </div>
              )}

              <form onSubmit={handleCreateCategoria} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                    Nombre de la Categoría *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Chaquetas & Abrigos"
                    value={nombreCategoria}
                    onChange={(e) => setNombreCategoria(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                    Descripción
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej: Prendas de abrigo, cortavientos e impermeables..."
                    value={descripcionCategoria}
                    onChange={(e) => setDescripcionCategoria(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateCategoria(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCategoria}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {submittingCategoria ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear Categoría'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL: Editar Categoría */}
      {editingCategoria && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#0e1424] border border-slate-200 dark:border-slate-700 p-6 sm:p-7 space-y-5 shadow-2xl my-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Editar Categoría</h2>
                <button
                  onClick={() => setEditingCategoria(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorCategoria && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                  {errorCategoria}
                </div>
              )}

              <form onSubmit={handleUpdateCategoria} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                    Nombre de la Categoría *
                  </label>
                  <input
                    type="text"
                    required
                    value={nombreCategoria}
                    onChange={(e) => setNombreCategoria(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                    Descripción
                  </label>
                  <textarea
                    rows={2}
                    value={descripcionCategoria}
                    onChange={(e) => setDescripcionCategoria(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingCategoria(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCategoria}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {submittingCategoria ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL: Confirmar Eliminar Categoría */}
      {deletingCategoria && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#0f121d] border border-rose-500/30 p-6 space-y-4 shadow-2xl text-center my-auto">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-500">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">¿Eliminar Categoría?</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  ¿Seguro que deseas eliminar la categoría <strong>"{deletingCategoria.nombre}"</strong>?
                </p>
              </div>
              {errorCategoria && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                  {errorCategoria}
                </div>
              )}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingCategoria(null)}
                  className="flex-1 py-2 px-4 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={submittingCategoria}
                  onClick={handleConfirmDeleteCategoria}
                  className="flex-1 py-2 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md"
                >
                  {submittingCategoria ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
