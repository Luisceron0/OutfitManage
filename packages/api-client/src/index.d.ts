export declare enum UserRole {
    ADMIN = "admin",
    VENDEDOR = "vendedor",
    BODEGA = "bodega"
}
export declare enum MovimientoTipo {
    ENTRADA = "entrada",
    SALIDA = "salida",
    AJUSTE = "ajuste",
    TRASLADO = "traslado",
    DEVOLUCION = "devolucion"
}
export declare enum UbicacionTipo {
    BODEGA = "bodega",
    TIENDA = "tienda"
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
export declare function generateIdempotencyKey(): string;
