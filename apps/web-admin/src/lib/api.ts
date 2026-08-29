import { v4 as uuidv4 } from 'uuid';
import {
  DashboardStats,
  Producto,
  Ubicacion,
  Categoria,
  MovimientoInventario,
  TipoMovimiento,
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function getAuthHeader(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('tienda360_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tienda360_token');
      localStorage.removeItem('tienda360_user');
      window.location.href = '/login';
    }
    throw new Error('Sesión expirada o no autorizada');
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    const msg = errorBody?.message
      ? Array.isArray(errorBody.message)
        ? errorBody.message.join(', ')
        : errorBody.message
      : res.statusText;
    throw new Error(msg || 'Error en la petición al servidor');
  }

  return await res.json();
}

export const api = {
  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await fetch(`${API_BASE_URL}/api/inventario/dashboard/stats`, {
      headers: { ...getAuthHeader(), Accept: 'application/json' },
    });
    return handleResponse<DashboardStats>(res);
  },

  // Productos
  getProductos: async (page = 1, limit = 20): Promise<{ items: Producto[]; meta: any }> => {
    const res = await fetch(`${API_BASE_URL}/api/productos?page=${page}&limit=${limit}`, {
      headers: { ...getAuthHeader(), Accept: 'application/json' },
    });
    return handleResponse(res);
  },

  createProducto: async (data: {
    nombre: string;
    descripcion?: string;
    categoriaId: string;
    visiblePublico?: boolean;
    variantes: {
      skuCode: string;
      talla: string;
      color: string;
      atributoOpcional?: string;
      barcode?: string;
      precio: number;
    }[];
  }): Promise<Producto> => {
    const res = await fetch(`${API_BASE_URL}/api/productos`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<Producto>(res);
  },

  updateProducto: async (
    id: string,
    data: {
      nombre?: string;
      descripcion?: string;
      categoriaId?: string;
      visiblePublico?: boolean;
      variantes?: {
        id?: string;
        skuCode: string;
        talla: string;
        color: string;
        atributoOpcional?: string;
        barcode?: string;
        precio?: number;
        activo?: boolean;
      }[];
    }
  ): Promise<Producto> => {
    const res = await fetch(`${API_BASE_URL}/api/productos/${id}`, {
      method: 'PATCH',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<Producto>(res);
  },

  deleteProducto: async (id: string): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/api/productos/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader(),
      },
    });
    return handleResponse(res);
  },

  // Ubicaciones
  getUbicaciones: async (): Promise<Ubicacion[]> => {
    const res = await fetch(`${API_BASE_URL}/api/ubicaciones`, {
      headers: { ...getAuthHeader(), Accept: 'application/json' },
    });
    return handleResponse<Ubicacion[]>(res);
  },

  createUbicacion: async (data: {
    nombre: string;
    tipo: 'BODEGA' | 'TIENDA';
    direccion?: string;
  }): Promise<Ubicacion> => {
    const res = await fetch(`${API_BASE_URL}/api/ubicaciones`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<Ubicacion>(res);
  },

  // Categorías
  getCategorias: async (): Promise<Categoria[]> => {
    const res = await fetch(`${API_BASE_URL}/api/categorias`, {
      headers: { ...getAuthHeader(), Accept: 'application/json' },
    });
    return handleResponse<Categoria[]>(res);
  },

  createCategoria: async (data: {
    nombre: string;
    descripcion?: string;
    categoriaPadreId?: string;
  }): Promise<Categoria> => {
    const res = await fetch(`${API_BASE_URL}/api/categorias`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<Categoria>(res);
  },

  // Inventario & Movimientos (con Idempotency-Key automática)
  createMovimiento: async (data: {
    varianteId: string;
    ubicacionId: string;
    ubicacionDestinoId?: string;
    tipo: TipoMovimiento;
    cantidad: number;
    motivo?: string;
  }): Promise<{ movimiento: MovimientoInventario; deduplicated: boolean }> => {
    const idempotencyKey = uuidv4();
    const res = await fetch(`${API_BASE_URL}/api/inventario/movimientos`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
        'idempotency-key': idempotencyKey,
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  getMovimientos: async (page = 1, limit = 20): Promise<{ items: MovimientoInventario[]; meta: any }> => {
    const res = await fetch(`${API_BASE_URL}/api/inventario/movimientos?page=${page}&limit=${limit}`, {
      headers: { ...getAuthHeader(), Accept: 'application/json' },
    });
    return handleResponse(res);
  },

  getStock: async (query: { varianteId?: string; sku?: string; ubicacionId?: string }) => {
    const params = new URLSearchParams();
    if (query.varianteId) params.append('varianteId', query.varianteId);
    if (query.sku) params.append('sku', query.sku);
    if (query.ubicacionId) params.append('ubicacionId', query.ubicacionId);

    const res = await fetch(`${API_BASE_URL}/api/inventario/stock?${params.toString()}`, {
      headers: { ...getAuthHeader(), Accept: 'application/json' },
    });
    return handleResponse<any>(res);
  },
};
