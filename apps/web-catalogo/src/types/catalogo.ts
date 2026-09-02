// Tipos del contrato público `/public/*` (backend: apps/backend/src/catalogo/catalogo.service.ts).
// Nunca incluyen costo, margen, proveedor ni cantidad exacta de stock (SRS 6.5).

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface CategoriaPublica {
  id: string;
  nombre: string;
  _count?: {
    productos: number;
  };
}

export interface ImagenPublica {
  url: string;
  tipo: 'IMAGE' | 'VIDEO';
  orden: number;
}

export interface VariantePublicaItem {
  id: string;
  skuCode: string;
  talla: string;
  color: string;
  atributoOpcional?: string | null;
  imagenes: ImagenPublica[];
  imagenUrl: string | null;
  disponible: boolean;
  stockStatus: StockStatus;
}

export interface ProductoPublicoItem {
  productoId: string;
  nombre: string;
  descripcion?: string | null;
  categoria: {
    id: string;
    nombre: string;
  };
  precioActual: number | null;
  imagenPrincipal: string | null;
  variantes: VariantePublicaItem[];
}

export interface CatalogoResponse {
  items: ProductoPublicoItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface VariantePublica extends VariantePublicaItem {
  precio: number | null;
}

export interface ImagenDetallePublica extends ImagenPublica {
  urlStorage: string;
}

export interface ProductoDetallePublico {
  productoId: string;
  nombre: string;
  descripcion?: string | null;
  categoria: {
    id: string;
    nombre: string;
  };
  precioActual: number | null;
  imagenes: ImagenDetallePublica[];
  variantes: VariantePublica[];
  whatsappLink: string;
}
