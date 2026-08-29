import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchProductoDetalle } from '../../../lib/api';
import ProductDetailView from '../../../components/ProductDetailView';

interface ProductoPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductoPageProps): Promise<Metadata> {
  const { id } = await params;
  const producto = await fetchProductoDetalle(id);

  if (!producto) {
    return {
      title: 'Producto no encontrado | Catálogo Oficial',
    };
  }

  return {
    title: `${producto.nombre} | Catálogo Oficial`,
    description: producto.descripcion || `Descubre ${producto.nombre} en nuestra tienda. Consulta disponibilidad y pide por WhatsApp.`,
    openGraph: {
      title: `${producto.nombre} | Catálogo Oficial`,
      description: producto.descripcion || `Prenda disponible en nuestra colección de temporada.`,
      images: producto.imagenes.map((img) => ({ url: img.urlStorage })),
    },
  };
}

export default async function ProductoPage({ params }: ProductoPageProps) {
  const { id } = await params;
  const producto = await fetchProductoDetalle(id);

  if (!producto) {
    notFound();
  }

  return <ProductDetailView producto={producto} />;
}
