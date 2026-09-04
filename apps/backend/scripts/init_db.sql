-- ==============================================================================
-- SCRIPT SQL DE CREACIÓN Y POBLADO DE BASE DE DATOS PARA DBEAVER (PostgreSQL)
-- Producto: Tienda360 — SRS v1.1
--
-- ADVERTENCIA (2026-09-02): la fuente de verdad del esquema es
-- apps/backend/prisma/migrations/ (Prisma Migrate), no este script. Este archivo quedó
-- desactualizado respecto al schema real (p. ej. sus imágenes de ejemplo apuntan a
-- res.cloudinary.com, mientras el código usa Supabase Storage) y sus hashes bcrypt de
-- ejemplo son truncados/no funcionales. Úsalo solo como referencia rápida para poblar
-- datos de demostración en DBeaver contra una base ya migrada con
-- `npx prisma migrate deploy` — nunca como reemplazo de las migraciones ni como
-- fuente del DDL en un despliegue real.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. PREPARACIÓN DE EXTENSIONES Y TIPOS ENUM
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Eliminar tipos si existen previamente (para permitir re-ejecución limpia)
DROP TABLE IF EXISTS saldo_inventario CASCADE;
DROP TABLE IF EXISTS movimiento_inventario CASCADE;
DROP TABLE IF EXISTS precio_historico CASCADE;
DROP TABLE IF EXISTS variante_sku CASCADE;
DROP TABLE IF EXISTS imagen_producto CASCADE;
DROP TABLE IF EXISTS producto CASCADE;
DROP TABLE IF EXISTS categoria CASCADE;
DROP TABLE IF EXISTS ubicacion CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;

DROP TYPE IF EXISTS rol_enum CASCADE;
DROP TYPE IF EXISTS ubicacion_tipo_enum CASCADE;
DROP TYPE IF EXISTS movimiento_tipo_enum CASCADE;

-- Crear Enums oficiales
CREATE TYPE rol_enum AS ENUM ('admin', 'vendedor', 'bodega');
CREATE TYPE ubicacion_tipo_enum AS ENUM ('bodega', 'tienda');
CREATE TYPE movimiento_tipo_enum AS ENUM ('entrada', 'salida', 'ajuste', 'traslado', 'devolucion');

-- ------------------------------------------------------------------------------
-- 1. TABLAS DDL (ESTRUCTURA DE BASE DE DATOS)
-- ------------------------------------------------------------------------------

-- Tabla: usuario
CREATE TABLE usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol rol_enum NOT NULL DEFAULT 'vendedor',
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: ubicacion
CREATE TABLE ubicacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    tipo ubicacion_tipo_enum NOT NULL,
    direccion TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: categoria (Jerárquica)
CREATE TABLE categoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria_padre_id UUID REFERENCES categoria(id) ON DELETE SET NULL,
    activo BOOLEAN NOT NULL DEFAULT true
);

-- Tabla: producto
CREATE TABLE producto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria_id UUID NOT NULL REFERENCES categoria(id) ON DELETE RESTRICT,
    visible_publico BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: imagen_producto
CREATE TABLE imagen_producto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL REFERENCES producto(id) ON DELETE CASCADE,
    url_storage TEXT NOT NULL,
    orden INT NOT NULL DEFAULT 0
);

-- Tabla: variante_sku (SKU por talla/color)
CREATE TABLE variante_sku (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL REFERENCES producto(id) ON DELETE CASCADE,
    sku_code VARCHAR(100) UNIQUE NOT NULL,
    talla VARCHAR(50) NOT NULL,
    color VARCHAR(50) NOT NULL,
    atributo_opcional VARCHAR(100),
    barcode VARCHAR(100) UNIQUE,
    activo BOOLEAN NOT NULL DEFAULT true
);

-- Tabla: precio_historico
CREATE TABLE precio_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variante_id UUID NOT NULL REFERENCES variante_sku(id) ON DELETE CASCADE,
    precio NUMERIC(12, 2) NOT NULL,
    vigente_desde TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    vigente_hasta TIMESTAMPTZ
);

-- Tabla: movimiento_inventario (Ledger inmutable)
CREATE TABLE movimiento_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variante_id UUID NOT NULL REFERENCES variante_sku(id) ON DELETE RESTRICT,
    ubicacion_id UUID NOT NULL REFERENCES ubicacion(id) ON DELETE RESTRICT,
    ubicacion_destino_id UUID REFERENCES ubicacion(id) ON DELETE RESTRICT,
    tipo movimiento_tipo_enum NOT NULL,
    cantidad INT NOT NULL,
    motivo TEXT,
    usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    movimiento_referencia_id UUID REFERENCES movimiento_inventario(id) ON DELETE SET NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: saldo_inventario (Materializado por clave compuesta)
CREATE TABLE saldo_inventario (
    variante_id UUID NOT NULL REFERENCES variante_sku(id) ON DELETE CASCADE,
    ubicacion_id UUID NOT NULL REFERENCES ubicacion(id) ON DELETE CASCADE,
    cantidad INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (variante_id, ubicacion_id)
);

-- Índices de Rendimiento
CREATE INDEX idx_variante_sku_producto ON variante_sku(producto_id);
CREATE INDEX idx_movimiento_variante ON movimiento_inventario(variante_id);
CREATE INDEX idx_movimiento_ubicacion ON movimiento_inventario(ubicacion_id);
CREATE INDEX idx_saldo_ubicacion ON saldo_inventario(ubicacion_id);

-- ------------------------------------------------------------------------------
-- 2. DATOS DE PRUEBA / SEEDS (DML)
-- ------------------------------------------------------------------------------

-- 2.1 Usuarios Iniciales (Admin, Vendedor, Bodega)
-- Nota: En producción las passwords deben estar Hasheadas con bcrypt/argon2.
INSERT INTO usuario (id, nombre, email, password_hash, rol, activo) VALUES
('11111111-1111-4111-a111-111111111111', 'Carlos Admin', 'admin@tienda360.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6L65Z35Z35Z35Z35', 'admin', true),
('22222222-2222-4222-a222-222222222222', 'Ana Vendedora', 'vendedor@tienda360.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6L65Z35Z35Z35Z35', 'vendedor', true),
('33333333-3333-4333-a333-333333333333', 'Pedro Bodeguero', 'bodega@tienda360.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6L65Z35Z35Z35Z35', 'bodega', true);

-- 2.2 Ubicaciones (Bodega Principal + Tienda Piso de Venta)
INSERT INTO ubicacion (id, nombre, tipo, direccion, activo) VALUES
('a0000000-0000-0000-0000-000000000001', 'Bodega Principal Centro', 'bodega', 'Calle 10 # 45-12, Z. Industrial', true),
('a0000000-0000-0000-0000-000000000002', 'Tienda Centro Comercial', 'tienda', 'Carrera 7 # 100-20, Local 104', true);

-- 2.3 Categorías
INSERT INTO categoria (id, nombre, descripcion, categoria_padre_id, activo) VALUES
('b0000000-0000-0000-0000-000000000001', 'Ropa Masculina', 'Colección de ropa para hombre', NULL, true),
('b0000000-0000-0000-0000-000000000002', 'Camisetas Hombre', 'Camisetas y polos masculinos', 'b0000000-0000-0000-0000-000000000001', true),
('b0000000-0000-0000-0000-000000000003', 'Pantalones Hombre', 'Jeans y pantalones casuales', 'b0000000-0000-0000-0000-000000000001', true),
('b0000000-0000-0000-0000-000000000004', 'Ropa Femenina', 'Colección de ropa para mujer', NULL, true),
('b0000000-0000-0000-0000-000000000005', 'Vestidos', 'Vestidos de verano y fiesta', 'b0000000-0000-0000-0000-000000000004', true);

-- 2.4 Productos
INSERT INTO producto (id, nombre, descripcion, categoria_id, visible_publico) VALUES
('c0000000-0000-0000-0000-000000000001', 'Camiseta Polo Slim Fit', 'Camiseta polo de algodón pima transpirable', 'b0000000-0000-0000-0000-000000000002', true),
('c0000000-0000-0000-0000-000000000002', 'Jean Denim Classic Fit', 'Pantalon jean azul de corte clásico de alta durabilidad', 'b0000000-0000-0000-0000-000000000003', true),
('c0000000-0000-0000-0000-000000000003', 'Vestido Floral Verano', 'Vestido corto fresco con estampado floral multicolor', 'b0000000-0000-0000-0000-000000000005', true);

-- 2.5 Imágenes de Productos
INSERT INTO imagen_producto (id, producto_id, url_storage, orden) VALUES
(gen_random_uuid(), 'c0000000-0000-0000-0000-000000000001', 'https://res.cloudinary.com/demo/image/upload/v1/polo_azul.jpg', 1),
(gen_random_uuid(), 'c0000000-0000-0000-0000-000000000002', 'https://res.cloudinary.com/demo/image/upload/v1/jean_classic.jpg', 1),
(gen_random_uuid(), 'c0000000-0000-0000-0000-000000000003', 'https://res.cloudinary.com/demo/image/upload/v1/vestido_floral.jpg', 1);

-- 2.6 Variantes de Productos (SKU por Talla/Color)
INSERT INTO variante_sku (id, producto_id, sku_code, talla, color, atributo_opcional, barcode, activo) VALUES
('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'POLO-AZU-S', 'S', 'Azul Marino', 'Slim Fit', '770123456701', true),
('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'POLO-AZU-M', 'M', 'Azul Marino', 'Slim Fit', '770123456702', true),
('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'POLO-NEG-L', 'L', 'Negro', 'Slim Fit', '770123456703', true),
('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 'JEAN-AZU-30', '30', 'Azul Denim', 'Classic', '770123456801', true),
('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000003', 'VEST-EST-S', 'S', 'Estampado Floral', 'Sin manga', '770123456901', true);

-- 2.7 Precios Históricos
INSERT INTO precio_historico (id, variante_id, precio, vigente_desde, vigente_hasta) VALUES
(gen_random_uuid(), 'd0000000-0000-0000-0000-000000000001', 89900.00, CURRENT_TIMESTAMP, NULL),
(gen_random_uuid(), 'd0000000-0000-0000-0000-000000000002', 89900.00, CURRENT_TIMESTAMP, NULL),
(gen_random_uuid(), 'd0000000-0000-0000-0000-000000000003', 95900.00, CURRENT_TIMESTAMP, NULL),
(gen_random_uuid(), 'd0000000-0000-0000-0000-000000000004', 139900.00, CURRENT_TIMESTAMP, NULL),
(gen_random_uuid(), 'd0000000-0000-0000-0000-000000000005', 119900.00, CURRENT_TIMESTAMP, NULL);

-- 2.8 Movimientos de Inventario Inicial (Ledger)
INSERT INTO movimiento_inventario (id, variante_id, ubicacion_id, tipo, cantidad, motivo, usuario_id, idempotency_key) VALUES
('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'entrada', 50, 'Inventario Inicial Proveedor A', '33333333-3333-4333-a333-333333333333', 'init-seed-key-001'),
('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'entrada', 40, 'Inventario Inicial Proveedor A', '33333333-3333-4333-a333-333333333333', 'init-seed-key-002'),
('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'entrada', 30, 'Inventario Inicial Proveedor A', '33333333-3333-4333-a333-333333333333', 'init-seed-key-003'),
('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'entrada', 25, 'Inventario Inicial Proveedor B', '33333333-3333-4333-a333-333333333333', 'init-seed-key-004'),
('e0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'entrada', 20, 'Inventario Inicial Proveedor C', '33333333-3333-4333-a333-333333333333', 'init-seed-key-005');

-- Movimiento de Traslado (10 Polos Azul S de Bodega Principal a Tienda Centro)
INSERT INTO movimiento_inventario (id, variante_id, ubicacion_id, ubicacion_destino_id, tipo, cantidad, motivo, usuario_id, idempotency_key) VALUES
('e0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'traslado', 10, 'Traslado a vitrina de exhibición', '33333333-3333-4333-a333-333333333333', 'init-seed-key-006');

-- 2.9 Saldo de Inventario Materializado (Suma derivada del Ledger de movimientos)
INSERT INTO saldo_inventario (variante_id, ubicacion_id, cantidad) VALUES
('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 40), -- 50 inicial - 10 trasladados
('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 10), -- 10 recibidos por traslado
('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 40),
('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 30),
('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 25),
('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 20);

COMMIT;

-- Verificación de ejecución exitosa
SELECT 'Tablas e inserciones creadas con éxito' AS estado, count(*) AS total_usuarios FROM usuario;
