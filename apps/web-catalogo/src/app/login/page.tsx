'use client';

import { useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { useToast } from '../../lib/toast-context';
import { useTheme } from '../../lib/theme-context';
import Link from 'next/link';
import InteractiveGrid from '../../components/ui/InteractiveGrid';
import {
  Sparkles,
  Lock,
  Mail,
  Loader2,
  ArrowRight,
  Store,
  Sun,
  Moon,
  ArrowLeft,
} from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login({ email, password });
      toast.success(
        `¡Bienvenido de nuevo, ${user.nombre}! Redirigiendo a tu espacio...`,
        'Inicio de Sesión Exitoso'
      );
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
      toast.error(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-center items-center px-4 py-12 overflow-hidden selection:bg-sky-500 selection:text-white">
      {/* Framer Interactive Grid Background (Pull Effect) */}
      <InteractiveGrid
        themeMode={theme === 'dark' ? 'dark' : 'blue'}
      />

      {/* Top action bar: Volver a tienda & Theme toggle */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-30">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-white/20 hover:bg-white/30 text-white backdrop-blur-xl border border-white/30 shadow-lg transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver a la tienda</span>
        </Link>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-xl border border-white/30 shadow-lg transition-all"
          title={theme === 'dark' ? 'Cambiar a modo azul eléctrico' : 'Cambiar a modo noche'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-white" />}
        </button>
      </div>

      {/* Main Login Content Card */}
      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/25 text-white text-xs font-semibold font-mono backdrop-blur-xl shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-sky-200" />
            <span>OutfitManage • Portal de Acceso</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
            Iniciar Sesión
          </h1>
          <p className="text-xs sm:text-sm text-sky-100/90 drop-shadow-xs">
            Ingresa tus credenciales para acceder a tu panel de control o catálogo
          </p>
        </div>

        {/* Card Login */}
        <div className="p-7 sm:p-8 rounded-3xl bg-white/95 dark:bg-[#0c101c]/95 backdrop-blur-2xl border border-white/40 dark:border-slate-800 shadow-2xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 focus:border-sky-500 focus:bg-white dark:focus:bg-slate-950 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 focus:border-sky-500 focus:bg-white dark:focus:bg-slate-950 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2 active:scale-[0.99]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Ingresar a la Plataforma</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Navigation */}
        <div className="text-center space-y-2">
          <p className="text-xs text-white/90 drop-shadow-xs">
            ¿Aún no tienes una cuenta?{' '}
            <Link
              href="/register"
              className="text-white font-extrabold hover:underline"
            >
              Regístrate aquí
            </Link>
          </p>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-white/75 hover:text-white transition-colors"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Ver vitrina pública sin iniciar sesión</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
