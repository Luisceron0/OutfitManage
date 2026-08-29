'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isPublicPage = pathname === '/login' || pathname === '/register';

  useEffect(() => {
    if (mounted && !isLoading && !token && !isPublicPage) {
      router.replace('/login');
    }
  }, [mounted, token, isLoading, isPublicPage, router]);

  // Si aún no se ha montado o está cargando el estado inicial
  if (!mounted || isLoading) {
    if (isPublicPage) {
      return <>{children}</>;
    }
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0f19] text-slate-300">
        <Loader2 className="w-8 h-8 animate-spin text-sky-400 mb-3" />
        <span className="text-xs font-semibold uppercase tracking-wider">Cargando sesión...</span>
      </div>
    );
  }

  // En páginas públicas (/login, /register), renderizar directamente
  if (isPublicPage) {
    return <>{children}</>;
  }

  // Si no hay token en ruta protegida, mostrar redirección
  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0f19] text-slate-300">
        <Loader2 className="w-8 h-8 animate-spin text-sky-400 mb-3" />
        <span className="text-xs font-semibold uppercase tracking-wider">Redirigiendo a inicio de sesión...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#0b0f19] text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
