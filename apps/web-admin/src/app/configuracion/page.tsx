'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useToast } from '../../lib/toast-context';
import { Ubicacion, Categoria } from '../../types';
import {
  Warehouse,
  FolderTree,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building,
  Store,
} from 'lucide-react';

export default function ConfiguracionPage() {
  const toast = useToast();
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Ubicación
  const [nombreUbicacion, setNombreUbicacion] = useState('');
  const [tipoUbicacion, setTipoUbicacion] = useState<'BODEGA' | 'TIENDA'>('TIENDA');
  const [direccion, setDireccion] = useState('');
  const [submittingUbicacion, setSubmittingUbicacion] = useState(false);
  const [errorUbicacion, setErrorUbicacion] = useState<string | null>(null);

  // Form Categoría
  const [nombreCategoria, setNombreCategoria] = useState('');
  const [descripcionCategoria, setDescripcionCategoria] = useState('');
  const [submittingCategoria, setSubmittingCategoria] = useState(false);
  const [errorCategoria, setErrorCategoria] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ubis, cats] = await Promise.all([
        api.getUbicaciones(),
        api.getCategorias(),
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

  const handleCreateUbicacion = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorUbicacion(null);
    setSubmittingUbicacion(true);
    try {
      await api.createUbicacion({
        nombre: nombreUbicacion,
        tipo: tipoUbicacion,
        direccion: direccion.trim() || undefined,
      });
      toast.success(`La ubicación "${nombreUbicacion}" (${tipoUbicacion}) fue creada.`, '¡Ubicación Registrada!');
      setNombreUbicacion('');
      setDireccion('');
      await loadData();
    } catch (err: any) {
      setErrorUbicacion(err.message || 'Error al crear ubicación');
      toast.error(err.message || 'Error al crear ubicación');
    } finally {
      setSubmittingUbicacion(false);
    }
  };

  const handleCreateCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorCategoria(null);
    setSubmittingCategoria(true);
    try {
      await api.createCategoria({
        nombre: nombreCategoria,
        descripcion: descripcionCategoria.trim() || undefined,
      });
      toast.success(`La categoría "${nombreCategoria}" está lista para clasificar prendas.`, '¡Categoría Creada!');
      setNombreCategoria('');
      setDescripcionCategoria('');
      await loadData();
    } catch (err: any) {
      setErrorCategoria(err.message || 'Error al crear categoría');
      toast.error(err.message || 'Error al crear categoría');
    } finally {
      setSubmittingCategoria(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Almacenes & Categorías
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Configura bodegas principales, puntos de venta físicos y taxonomía de prendas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sección: Ubicaciones / Almacenes */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl glass-card border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Warehouse className="w-5 h-5 text-sky-400" />
              <span>Registrar Nueva Ubicación</span>
            </h2>

            {errorUbicacion && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                {errorUbicacion}
              </div>
            )}

            <form onSubmit={handleCreateUbicacion} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Nombre del Punto / Almacén *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Tienda Centro Comercial"
                  value={nombreUbicacion}
                  onChange={(e) => setNombreUbicacion(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-900 border border-slate-800 focus:border-sky-500 outline-none text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Tipo de Ubicación
                  </label>
                  <select
                    value={tipoUbicacion}
                    onChange={(e) => setTipoUbicacion(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-900 border border-slate-800 focus:border-sky-500 outline-none text-white"
                  >
                    <option value="TIENDA">Tienda (Punto Físico)</option>
                    <option value="BODEGA">Bodega Principal</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Dirección Física
                  </label>
                  <input
                    type="text"
                    placeholder="Calle 10 # 40-20"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-900 border border-slate-800 focus:border-sky-500 outline-none text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingUbicacion}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-2"
              >
                {submittingUbicacion ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Guardar Ubicación</span>
              </button>
            </form>
          </div>

          {/* Listado de Ubicaciones */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Ubicaciones Registradas ({ubicaciones.length})
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              {ubicaciones.map((u) => (
                <div
                  key={u.id}
                  className="p-4 rounded-2xl glass-card border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 text-sky-400 flex items-center justify-center border border-slate-700">
                      {u.tipo === 'BODEGA' ? <Building className="w-4 h-4" /> : <Store className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="font-bold text-white text-sm block">{u.nombre}</span>
                      {u.direccion && <span className="text-[11px] text-slate-400">{u.direccion}</span>}
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      u.tipo === 'BODEGA'
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                        : 'bg-sky-500/10 text-sky-300 border border-sky-500/30'
                    }`}
                  >
                    {u.tipo}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sección: Categorías */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl glass-card border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-emerald-400" />
              <span>Registrar Nueva Categoría</span>
            </h2>

            {errorCategoria && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                {errorCategoria}
              </div>
            )}

            <form onSubmit={handleCreateCategoria} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Nombre de la Categoría *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Calzado, Chaquetas, Accesorios"
                  value={nombreCategoria}
                  onChange={(e) => setNombreCategoria(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-900 border border-slate-800 focus:border-emerald-500 outline-none text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Descripción
                </label>
                <input
                  type="text"
                  placeholder="Ej: Ropa casual para hombre y mujer"
                  value={descripcionCategoria}
                  onChange={(e) => setDescripcionCategoria(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-900 border border-slate-800 focus:border-emerald-500 outline-none text-white"
                />
              </div>

              <button
                type="submit"
                disabled={submittingCategoria}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-white shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                {submittingCategoria ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Guardar Categoría</span>
              </button>
            </form>
          </div>

          {/* Listado de Categorías */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Categorías Activas ({categorias.length})
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              {categorias.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl glass-card border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-white text-sm block">{c.nombre}</span>
                    {c.descripcion && <span className="text-[11px] text-slate-400">{c.descripcion}</span>}
                  </div>

                  {c.subcategorias && c.subcategorias.length > 0 && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 font-medium">
                      {c.subcategorias.length} subcategorías
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
