export enum UserRole {
  ADMIN = 'admin',
  VENDEDOR = 'vendedor',
  BODEGA = 'bodega',
}

export enum MovimientoTipo {
  ENTRADA = 'entrada',
  SALIDA = 'salida',
  AJUSTE = 'ajuste',
  TRASLADO = 'traslado',
  DEVOLUCION = 'devolucion',
}

export enum UbicacionTipo {
  BODEGA = 'bodega',
  TIENDA = 'tienda',
}

export interface MovimientoPayload {
  variante_id: string;
  ubicacion_id: string;
  ubicacion_destino_id?: string;
  tipo: MovimientoTipo;
  cantidad: number;
  motivo?: string;
  idempotency_key: string;
}

export function generateIdempotencyKey(): string {
  // UUID v4 format generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
