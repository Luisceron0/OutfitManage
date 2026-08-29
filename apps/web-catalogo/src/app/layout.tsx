import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import Providers from '../components/Providers';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#050505' },
    { media: '(prefers-color-scheme: light)', color: '#0284c7' },
  ],
};

export const metadata: Metadata = {
  title: 'OutfitManage | Catálogo Virtual & Gestión de Inventario',
  description: 'Descubre nuestra colección de moda y prendas exclusivas. Consulta disponibilidad en tiempo real y gestiona inventario omnicanal.',
  applicationName: 'OutfitManage',
  authors: [{ name: 'OutfitManage Team' }],
  keywords: ['moda', 'ropa', 'catálogo', 'tienda de ropa', 'colección', 'prendas', 'inventario'],
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'OutfitManage',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'OutfitManage | Catálogo Virtual & Gestión de Inventario',
    description: 'Explora prendas exclusivas de temporada y contacta directamente con nuestros asesores por WhatsApp.',
    type: 'website',
    locale: 'es_CO',
    siteName: 'OutfitManage',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${outfit.variable} scroll-smooth`}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
      </head>
      <body className="min-h-screen flex flex-col font-sans bg-[#050505] text-white selection:bg-sky-500 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
