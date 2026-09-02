// Tipos y utilidades compartidas entre los frontends autenticados (web-admin, web-catalogo/admin)
// y el backend. Los valores deben coincidir exactamente con los DTOs reales de NestJS
// (apps/backend/src/**/dto/*.ts) y con los enums de Prisma (apps/backend/prisma/schema.prisma):
// el wire format de la API es siempre en mayúsculas y camelCase, nunca snake_case.

export enum UserRole {
  ADMIN = 'ADMIN',
  VENDEDOR = 'VENDEDOR',
  BODEGA = 'BODEGA',
  CLIENTE = 'CLIENTE',
}

export enum MovimientoTipo {
  ENTRADA = 'ENTRADA',
  SALIDA = 'SALIDA',
  AJUSTE = 'AJUSTE',
  TRASLADO = 'TRASLADO',
  DEVOLUCION = 'DEVOLUCION',
}

export enum UbicacionTipo {
  BODEGA = 'BODEGA',
  TIENDA = 'TIENDA',
}

// Cuerpo JSON de `POST /api/inventario/movimientos` (ver CreateMovimientoDto). La
// Idempotency-Key nunca va en el body: es obligatoria como header `idempotency-key`.
export interface MovimientoPayload {
  varianteId: string;
  ubicacionId: string;
  ubicacionDestinoId?: string;
  tipo: MovimientoTipo;
  cantidad: number;
  motivo?: string;
}

export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback para runtimes sin crypto.randomUUID (Node < 19 sin flag, motores JS antiguos)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
