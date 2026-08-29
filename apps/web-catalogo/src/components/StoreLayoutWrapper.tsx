'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';

export default function StoreLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isCustomLayoutRoute =
    pathname === '/' ||
    pathname === '/catalogo' ||
    pathname?.startsWith('/catalogo') ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname?.startsWith('/admin');

  if (isCustomLayoutRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Footer />
    </>
  );
}
