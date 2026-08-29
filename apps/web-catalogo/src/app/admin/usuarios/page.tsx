'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../../../lib/admin-api';
import { UsuarioAdmin, UserRole } from '../../../types/admin';
import { useToast } from '../../../lib/toast-context';
import { useAuth } from '../../../lib/auth-context';
import { ModalPortal } from '../../../components/ui/ModalPortal';
import { Pagination } from '../../../components/ui/Pagination';
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShoppingBag,
  Store,
  Boxes,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Loader2,
  RefreshCw,
  X,
  Lock,
  Mail,
  User,
  Shield,
  Activity,
  ArrowUpDown,
} from 'lucide-react';

export default function AdminUsuariosPage() {
  const toast = useToast();
  const { user: currentUser } = useAuth();

  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    totalAdmins: 0,
    totalClientes: 0,
    totalStaff: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [rolFiltro, setRolFiltro] = useState<string>('TODOS');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal Crear Usuario
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createNombre, setCreateNombre] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRol, setCreateRol] = useState<UserRole>('CLIENTE');
  const [createActivo, setCreateActivo] = useState(true);

  // Modal Editar Usuario
  const [editingUser, setEditingUser] = useState<UsuarioAdmin | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRol, setEditRol] = useState<UserRole>('CLIENTE');
  const [editActivo, setEditActivo] = useState(true);
  const [editPassword, setEditPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await adminApi.getUsuarios({
        search: search.trim() || undefined,
        rol: rolFiltro !== 'TODOS' ? rolFiltro : undefined,
      });
      setUsuarios(resp.items || []);
      if (resp.stats) {
        setStats(resp.stats);
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  }, [search, rolFiltro, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadData]);

  // --- Crear Usuario ---
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      await adminApi.createUsuario({
        nombre: createNombre.trim(),
        email: createEmail.trim(),
        password: createPassword,
        rol: createRol,
        activo: createActivo,
      });

      toast.success(
        `Usuario "${createNombre}" registrado exitosamente con rol ${createRol}.`,
        'Usuario Creado'
      );
      setShowCreateModal(false);
      setCreateNombre('');
      setCreateEmail('');
      setCreatePassword('');
      setCreateRol('CLIENTE');
      setCreateActivo(true);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Error al crear el usuario');
      toast.error(err.message || 'Error al crear el usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Abrir Modal Editar ---
  const handleOpenEdit = (user: UsuarioAdmin) => {
    setEditingUser(user);
    setEditNombre(user.nombre);
    setEditEmail(user.email);
    setEditRol(user.rol);
    setEditActivo(user.activo);
    setEditPassword('');
    setFormError(null);
  };

  // --- Guardar Edición ---
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setFormError(null);
    setIsSubmitting(true);

    try {
      await adminApi.updateUsuario(editingUser.id, {
        nombre: editNombre.trim(),
        email: editEmail.trim(),
        rol: editRol,
        activo: editActivo,
        password: editPassword.trim() ? editPassword.trim() : undefined,
      });

      toast.success(
        `Datos de "${editNombre}" actualizados correctamente.`,
        'Usuario Actualizado'
      );
      setEditingUser(null);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Error al actualizar usuario');
      toast.error(err.message || 'Error al actualizar usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Alternar Activo / Inactivo Rápido ---
  const handleToggleActivo = async (user: UsuarioAdmin) => {
    if (user.id === currentUser?.id) {
      toast.warning('No puedes desactivar tu propia cuenta activa de Administrador.');
      return;
    }

    try {
      const updated = await adminApi.toggleUsuarioActivo(user.id);
      const statusText = updated.activo ? 'Activada' : 'Suspendida';
      toast.success(
        `Cuenta de ${user.nombre} ${statusText}.`,
        'Estado de Cuenta Modificado'
      );
      setUsuarios((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, activo: updated.activo } : u))
      );
    } catch (err: any) {
      toast.error(err.message || 'Error al cambiar estado del usuario');
    }
  };

  // --- Eliminar Usuario ---
  const handleDelete = async (user: UsuarioAdmin) => {
    if (user.id === currentUser?.id) {
      toast.warning('No puedes eliminar tu propia cuenta de Administrador.');
      return;
    }

    if (
      !confirm(
        `¿Estás seguro de eliminar permanentemente al usuario "${user.nombre}" (${user.email})? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    try {
      await adminApi.deleteUsuario(user.id);
      toast.success(`Usuario "${user.nombre}" eliminado del sistema.`, 'Usuario Eliminado');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar usuario');
    }
  };

  // Badge de rol estilizado
  const getRoleBadge = (rol: UserRole) => {
    switch (rol) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20 font-mono">
            <ShieldCheck className="w-3.5 h-3.5" /> Administrador
          </span>
        );
      case 'CLIENTE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-mono">
            <ShoppingBag className="w-3.5 h-3.5" /> Cliente
          </span>
        );
      case 'VENDEDOR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-mono">
            <Store className="w-3.5 h-3.5" /> Vendedor
          </span>
        );
      case 'BODEGA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20 font-mono">
            <Boxes className="w-3.5 h-3.5" /> Bodega
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {rol}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Gestión de Usuarios
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Administra los roles, accesos y permisos de clientes, administradores y personal de tienda
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            title="Refrescar lista"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-xs transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              setFormError(null);
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white shadow-md shadow-sky-500/25 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase font-mono">
              Total Usuarios
            </span>
            <Users className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono mt-2">
            {stats.totalUsuarios}
          </p>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">
            Cuentas registradas en BD
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase font-mono">
              Clientes (Tienda)
            </span>
            <ShoppingBag className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-2">
            {stats.totalClientes}
          </p>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">
            Usuarios finales de compras
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase font-mono">
              Administradores
            </span>
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-2">
            {stats.totalAdmins}
          </p>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">
            Acceso total a /admin
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase font-mono">
              Staff / Operación
            </span>
            <Store className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono mt-2">
            {stats.totalStaff}
          </p>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">
            Vendedores y Bodegueros
          </span>
        </div>
      </div>

      {/* Barra de Filtro y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o correo electrónico..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 focus:border-sky-500 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
            Filtrar Rol:
          </span>
          <select
            value={rolFiltro}
            onChange={(e) => setRolFiltro(e.target.value)}
            className="px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-sky-500 outline-none text-slate-900 dark:text-white w-full sm:w-auto font-mono"
          >
            <option value="TODOS">Todos los roles</option>
            <option value="CLIENTE">Clientes</option>
            <option value="ADMIN">Administradores</option>
            <option value="VENDEDOR">Vendedores</option>
            <option value="BODEGA">Bodega</option>
          </select>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-sky-500 mb-3" />
            <span className="text-xs font-semibold uppercase font-mono">
              Cargando directorio de usuarios...
            </span>
          </div>
        ) : usuarios.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase font-mono text-[10px] tracking-wider">
                  <tr>
                    <th className="py-4 px-6 font-bold">Usuario / Contacto</th>
                    <th className="py-4 px-6 font-bold">Rol Asignado</th>
                    <th className="py-4 px-6 font-bold">Estado de Acceso</th>
                    <th className="py-4 px-6 font-bold text-center">Movimientos</th>
                    <th className="py-4 px-6 font-bold">Fecha de Registro</th>
                    <th className="py-4 px-6 font-bold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {usuarios
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((u) => {
                      const isCurrent = u.id === currentUser?.id;
                      const initials = u.nombre
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase();

                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          {/* Usuario info */}
                          <td className="py-4 px-6 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                                {initials || 'U'}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 dark:text-white block text-sm">
                                    {u.nombre}
                                  </span>
                                  {isCurrent && (
                                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                                      Tú
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-slate-500 font-mono block">
                                  {u.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Rol */}
                          <td className="py-4 px-6 whitespace-nowrap">
                            {getRoleBadge(u.rol)}
                          </td>

                          {/* Estado Activo / Inactivo */}
                          <td className="py-4 px-6 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleToggleActivo(u)}
                              disabled={isCurrent}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
                                u.activo
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                              } ${isCurrent ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                              title={
                                isCurrent
                                  ? 'No puedes desactivar tu propia cuenta'
                                  : u.activo
                                  ? 'Clic para suspender acceso'
                                  : 'Clic para activar acceso'
                              }
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  u.activo ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                                }`}
                              />
                              <span>{u.activo ? 'Activo' : 'Suspendido'}</span>
                            </button>
                          </td>

                          {/* Movimientos asociados */}
                          <td className="py-4 px-6 whitespace-nowrap text-center">
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                              {u._count?.movimientos || 0}
                            </span>
                          </td>

                          {/* Fecha de Registro */}
                          <td className="py-4 px-6 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                            {new Date(u.createdAt).toLocaleDateString('es-CO', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>

                          {/* Acciones */}
                          <td className="py-4 px-6 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEdit(u)}
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors"
                                title="Editar usuario y permisos"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDelete(u)}
                                disabled={isCurrent}
                                className={`p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors ${
                                  isCurrent
                                    ? 'opacity-30 cursor-not-allowed text-slate-400'
                                    : 'text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                }`}
                                title={
                                  isCurrent ? 'No puedes eliminarte a ti mismo' : 'Eliminar usuario'
                                }
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(usuarios.length / pageSize) || 1}
              totalItems={usuarios.length}
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
            <Users className="w-8 h-8 mx-auto text-slate-400" />
            <p className="text-sm font-semibold">No se encontraron usuarios registrados</p>
          </div>
        )}
      </div>

      {/* MODAL: Crear Nuevo Usuario */}
      {showCreateModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#0e1424] border border-slate-200 dark:border-slate-700 p-6 sm:p-7 space-y-5 shadow-2xl my-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-sky-500" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Registrar Nuevo Usuario
                  </h2>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                    Nombre Completo *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={createNombre}
                      onChange={(e) => setCreateNombre(e.target.value)}
                      placeholder="Ej: Daniel Restrepo"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                    Correo Electrónico *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                      placeholder="usuario@empresa.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                    Contraseña Inicial *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={createPassword}
                      onChange={(e) => setCreatePassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                      Rol Asignado *
                    </label>
                    <select
                      value={createRol}
                      onChange={(e) => setCreateRol(e.target.value as UserRole)}
                      className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 outline-none text-slate-900 dark:text-white font-mono"
                    >
                      <option value="CLIENTE">Cliente (Tienda)</option>
                      <option value="ADMIN">Administrador (/admin)</option>
                      <option value="VENDEDOR">Vendedor</option>
                      <option value="BODEGA">Bodega</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                      Estado Inicial
                    </label>
                    <select
                      value={createActivo ? 'true' : 'false'}
                      onChange={(e) => setCreateActivo(e.target.value === 'true')}
                      className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 outline-none text-slate-900 dark:text-white font-mono"
                    >
                      <option value="true">Activo</option>
                      <option value="false">Suspendido</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white shadow-md shadow-sky-500/25 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>Crear Usuario</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL: Editar Usuario */}
      {editingUser && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#0e1424] border border-slate-200 dark:border-slate-700 p-6 sm:p-7 space-y-5 shadow-2xl my-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-sky-500" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Editar Usuario
                  </h2>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                  {formError}
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                    Nombre Completo *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                    Correo Electrónico *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                      Rol en Sistema *
                    </label>
                    <select
                      value={editRol}
                      onChange={(e) => setEditRol(e.target.value as UserRole)}
                      disabled={editingUser.id === currentUser?.id}
                      className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 outline-none text-slate-900 dark:text-white font-mono disabled:opacity-60"
                    >
                      <option value="CLIENTE">Cliente</option>
                      <option value="ADMIN">Administrador</option>
                      <option value="VENDEDOR">Vendedor</option>
                      <option value="BODEGA">Bodega</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                      Estado de Acceso
                    </label>
                    <select
                      value={editActivo ? 'true' : 'false'}
                      onChange={(e) => setEditActivo(e.target.value === 'true')}
                      disabled={editingUser.id === currentUser?.id}
                      className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 outline-none text-slate-900 dark:text-white font-mono disabled:opacity-60"
                    >
                      <option value="true">Activo</option>
                      <option value="false">Suspendido</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono flex items-center justify-between">
                    <span>Restablecer Contraseña</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      (Dejar vacío para no cambiar)
                    </span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      minLength={6}
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Nueva contraseña..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white shadow-md shadow-sky-500/25 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>Guardar Cambios</span>
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
