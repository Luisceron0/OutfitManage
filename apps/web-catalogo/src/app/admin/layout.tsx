import type { Metadata } from 'next';
import AdminGuard from '../../components/admin/AdminGuard';
import AdminLayoutClient from '../../components/admin/AdminLayoutClient';

export const metadata: Metadata = {
  title: 'OutfitManage Admin | Gestor de Inventario',
  description: 'Panel administrativo de control de inventario, stock y movimientos.',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <AdminLayoutClient>{children}</AdminLayoutClient>
    </AdminGuard>
  );
}
