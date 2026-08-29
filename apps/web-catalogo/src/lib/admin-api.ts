import {
  Producto,
  Ubicacion,
  Categoria,
  MovimientoInventario,
  TipoMovimiento,
  DashboardStats,
  UsuarioAdmin,
  UsuariosResponse,
} from '../types/admin';
import { getPrivateApiUrl } from './api';

const API_ROOT = getPrivateApiUrl('');

function getAuthHeader(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('tienda360_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `key-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    let message = 'Ocurrió un error inesperado';
    if (Array.isArray(errorData?.message)) {
      message = errorData.message.join(', ');
    } else if (errorData?.message) {
      message = errorData.message;
    } else if (errorData?.error && typeof errorData.error === 'string') {
      message = errorData.error;
    } else {
      message = `Error ${res.status}: ${res.statusText}`;
    }

    const err: any = new Error(message);
    err.data = errorData;
    err.status = res.status;
    err.code = errorData?.error;
    err.disponible = errorData?.disponible;
    err.solicitado = errorData?.solicitado;
    throw err;
  }
  return await res.json();
}

export const adminApi = {
  // Storage & Media
  uploadMedia: async (
    file: File,
    folder?: string
  ): Promise<{
    bucket: string;
    path: string;
    signedUrl: string;
    tipo: 'IMAGE' | 'VIDEO';
    originalName: string;
    size: number;
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) formData.append('folder', folder);

    const token = typeof window !== 'undefined' ? localStorage.getItem('tienda360_token') : null;

    const res = await fetch(`${API_ROOT}/storage/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    return handleResponse(res);
  },

  deleteMediaFile: async (bucket: string, path: string): Promise<{ success: boolean }> => {
    const res = await fetch(`${API_ROOT}/storage/file`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bucket, path }),
    });
    return handleResponse(res);
  },

  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await fetch(`${API_ROOT}/inventario/dashboard/stats`, {
      headers: { ...getAuthHeader(), Accept: 'application/json' },
    });
    return handleResponse<DashboardStats>(res);
  },

  // Productos
  getProductos: async (page = 1, limit = 50): Promise<{ items: Producto[]; meta: any }> => {
    const res = await fetch(`${API_ROOT}/productos?page=${page}&limit=${limit}`, {
      headers: { ...getAuthHeader(), Accept: 'application/json' },
    });
    return handleResponse(res);
  },

  createProducto: async (data: {
    nombre: string;
    descripcion?: string;
    categoriaId: string;
    visiblePublico?: boolean;
    imagenes?: string[];
    variantes: {
      skuCode: string;
      talla: string;
      color: string;
      atributoOpcional?: string;
      imagenUrl?: string;
      imagenes?: string[];
      barcode?: string;
      precio: number;
    }[];
  }): Promise<Producto> => {
    const res = await fetch(`${API_ROOT}/productos`, {
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
      imagenes?: string[];
      variantes?: {
        id?: string;
        skuCode: string;
        talla: string;
        color: string;
        atributoOpcional?: string;
        imagenUrl?: string;
        imagenes?: string[];
        barcode?: string;
        precio?: number;
        activo?: boolean;
      }[];
    }
  ): Promise<Producto> => {
    const res = await fetch(`${API_ROOT}/productos/${id}`, {
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
    const res = await fetch(`${API_ROOT}/productos/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader(),
      },
    });
    return handleResponse(res);
  },

  // Ubicaciones
  getUbicaciones: async (): Promise<Ubicacion[]> => {
    const res = await fetch(`${API_ROOT}/ubicaciones`, {
      headers: { ...getAuthHeader(), Accept: 'application/json' },
    });
    return handleResponse<Ubicacion[]>(res);
  },

  createUbicacion: async (data: {
    nombre: string;
    tipo: 'BODEGA' | 'TIENDA';
    direccion?: string;
  }): Promise<Ubicacion> => {
    const res = await fetch(`${API_ROOT}/ubicaciones`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<Ubicacion>(res);
  },

  updateUbicacion: async (
    id: string,
    data: {
      nombre?: string;
      tipo?: 'BODEGA' | 'TIENDA';
      direccion?: string;
    }
  ): Promise<Ubicacion> => {
    const res = await fetch(`${API_ROOT}/ubicaciones/${id}`, {
      method: 'PATCH',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<Ubicacion>(res);
  },

  deleteUbicacion: async (id: string): Promise<any> => {
    const res = await fetch(`${API_ROOT}/ubicaciones/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader(),
      },
    });
    return handleResponse(res);
  },

  // Categorías
  getCategorias: async (): Promise<Categoria[]> => {
    const res = await fetch(`${API_ROOT}/categorias`, {
      headers: { ...getAuthHeader(), Accept: 'application/json' },
    });
    return handleResponse<Categoria[]>(res);
  },

  createCategoria: async (data: {
    nombre: string;
    descripcion?: string;
    categoriaPadreId?: string;
  }): Promise<Categoria> => {
    const res = await fetch(`${API_ROOT}/categorias`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<Categoria>(res);
  },

  updateCategoria: async (
    id: string,
    data: {
      nombre?: string;
      descripcion?: string;
      categoriaPadreId?: string;
    }
  ): Promise<Categoria> => {
    const res = await fetch(`${API_ROOT}/categorias/${id}`, {
      method: 'PATCH',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<Categoria>(res);
  },

  deleteCategoria: async (id: string): Promise<any> => {
    const res = await fetch(`${API_ROOT}/categorias/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader(),
      },
    });
    return handleResponse(res);
  },

  // Movimientos Ledger
  getMovimientos: async (page = 1, limit = 30, tipo?: string): Promise<{ items: MovimientoInventario[]; meta: any }> => {
    const q = tipo && tipo !== 'TODOS' ? `&tipo=${encodeURIComponent(tipo)}` : '';
    const res = await fetch(`${API_ROOT}/inventario/movimientos?page=${page}&limit=${limit}${q}`, {
      headers: { ...getAuthHeader(), Accept: 'application/json' },
    });
    return handleResponse(res);
  },

  // Consulta Rápida de Stock (Vendedores y Bodega)
  buscarStockRapido: async (q?: string, categoriaId?: string): Promise<{ items: any[]; ubicaciones: Ubicacion[] }> => {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (categoriaId) params.append('categoriaId', categoriaId);

    const res = await fetch(`${API_ROOT}/inventario/buscar?${params.toString()}`, {
      headers: { ...getAuthHeader(), Accept: 'application/json' },
    });
    return handleResponse(res);
  },

  createMovimiento: async (
    data: {
      varianteId: string;
      ubicacionId: string;
      ubicacionDestinoId?: string;
      tipo: TipoMovimiento;
      cantidad: number;
      motivo?: string;
    },
    customIdempotencyKey?: string
  ): Promise<{
    message: string;
    movimiento: MovimientoInventario;
    deduplicated?: boolean;
  }> => {
    const idempotencyKey = customIdempotencyKey || generateIdempotencyKey();

    const res = await fetch(`${API_ROOT}/inventario/movimientos`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Usuarios
  getUsuarios: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    rol?: string;
  }): Promise<UsuariosResponse> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.rol && params.rol !== 'TODOS') query.append('rol', params.rol);

    const res = await fetch(`${API_ROOT}/usuarios?${query.toString()}`, {
      headers: { ...getAuthHeader(), Accept: 'application/json' },
    });
    return handleResponse<UsuariosResponse>(res);
  },

  createUsuario: async (data: {
    nombre: string;
    email: string;
    password: string;
    rol?: string;
    activo?: boolean;
  }): Promise<UsuarioAdmin> => {
    const res = await fetch(`${API_ROOT}/usuarios`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<UsuarioAdmin>(res);
  },

  updateUsuario: async (
    id: string,
    data: {
      nombre?: string;
      email?: string;
      password?: string;
      rol?: string;
      activo?: boolean;
    }
  ): Promise<UsuarioAdmin> => {
    const res = await fetch(`${API_ROOT}/usuarios/${id}`, {
      method: 'PATCH',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<UsuarioAdmin>(res);
  },

  toggleUsuarioActivo: async (id: string): Promise<UsuarioAdmin> => {
    const res = await fetch(`${API_ROOT}/usuarios/${id}/toggle-activo`, {
      method: 'PATCH',
      headers: {
        ...getAuthHeader(),
      },
    });
    return handleResponse<UsuarioAdmin>(res);
  },

  deleteUsuario: async (id: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_ROOT}/usuarios/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader(),
      },
    });
    return handleResponse(res);
  },
};
