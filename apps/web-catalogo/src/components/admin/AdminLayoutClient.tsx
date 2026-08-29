'use client';

import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';
import AdminMobileSidebar from './AdminMobileSidebar';

interface AdminLayoutClientProps {
  children: React.ReactNode;
}

export default function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#07090e] text-slate-900 dark:text-slate-100 antialiased selection:bg-sky-500 selection:text-white transition-colors w-full max-w-full overflow-x-hidden">
      {/* Desktop Sidebar (hidden on mobile, visible on lg) */}
      <AdminSidebar />

      {/* Mobile Drawer (visible only on mobile when opened) */}
      <AdminMobileSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 w-full max-w-full overflow-x-hidden">
        <AdminNavbar onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
