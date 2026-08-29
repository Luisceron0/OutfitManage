import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../lib/auth-context';
import { ToastProvider } from '../lib/toast-context';
import AuthGuard from '../components/AuthGuard';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Tienda360 | Gestor de Inventario',
  description: 'Panel de control de inventario ledger-based, gestión de SKUs y movimientos de stock.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${outfit.variable} dark`}>
      <body className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans selection:bg-sky-500 selection:text-white">
        <ToastProvider>
          <AuthProvider>
            <AuthGuard>{children}</AuthGuard>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
