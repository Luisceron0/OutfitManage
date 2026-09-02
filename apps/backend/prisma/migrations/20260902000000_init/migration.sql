-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "rol_enum" AS ENUM ('admin', 'vendedor', 'bodega', 'cliente');

-- CreateEnum
CREATE TYPE "ubicacion_tipo_enum" AS ENUM ('bodega', 'tienda');

-- CreateEnum
CREATE TYPE "movimiento_tipo_enum" AS ENUM ('entrada', 'salida', 'ajuste', 'traslado', 'devolucion');

-- CreateTable
CREATE TABLE "usuario" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" "rol_enum" NOT NULL DEFAULT 'cliente',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ubicacion" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "ubicacion_tipo_enum" NOT NULL,
    "direccion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ubicacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categoria" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria_padre_id" UUID,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "producto" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria_id" UUID NOT NULL,
    "visible_publico" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imagen_producto" (
    "id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "variante_id" UUID,
    "url_storage" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "imagen_producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variante_sku" (
    "id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "sku_code" TEXT NOT NULL,
    "talla" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "atributo_opcional" TEXT,
    "barcode" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "variante_sku_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "precio_historico" (
    "id" UUID NOT NULL,
    "variante_id" UUID NOT NULL,
    "precio" DECIMAL(12,2) NOT NULL,
    "vigente_desde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vigente_hasta" TIMESTAMP(3),

    CONSTRAINT "precio_historico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimiento_inventario" (
    "id" UUID NOT NULL,
    "variante_id" UUID NOT NULL,
    "ubicacion_id" UUID NOT NULL,
    "ubicacion_destino_id" UUID,
    "tipo" "movimiento_tipo_enum" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "motivo" TEXT,
    "usuario_id" UUID NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "movimiento_referencia_id" UUID,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimiento_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saldo_inventario" (
    "variante_id" UUID NOT NULL,
    "ubicacion_id" UUID NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saldo_inventario_pkey" PRIMARY KEY ("variante_id","ubicacion_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "variante_sku_sku_code_key" ON "variante_sku"("sku_code");

-- CreateIndex
CREATE UNIQUE INDEX "variante_sku_barcode_key" ON "variante_sku"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "movimiento_inventario_idempotency_key_key" ON "movimiento_inventario"("idempotency_key");

-- AddForeignKey
ALTER TABLE "categoria" ADD CONSTRAINT "categoria_categoria_padre_id_fkey" FOREIGN KEY ("categoria_padre_id") REFERENCES "categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto" ADD CONSTRAINT "producto_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imagen_producto" ADD CONSTRAINT "imagen_producto_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imagen_producto" ADD CONSTRAINT "imagen_producto_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variante_sku"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variante_sku" ADD CONSTRAINT "variante_sku_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "precio_historico" ADD CONSTRAINT "precio_historico_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variante_sku"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_inventario" ADD CONSTRAINT "movimiento_inventario_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variante_sku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_inventario" ADD CONSTRAINT "movimiento_inventario_ubicacion_id_fkey" FOREIGN KEY ("ubicacion_id") REFERENCES "ubicacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_inventario" ADD CONSTRAINT "movimiento_inventario_ubicacion_destino_id_fkey" FOREIGN KEY ("ubicacion_destino_id") REFERENCES "ubicacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_inventario" ADD CONSTRAINT "movimiento_inventario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_inventario" ADD CONSTRAINT "movimiento_inventario_movimiento_referencia_id_fkey" FOREIGN KEY ("movimiento_referencia_id") REFERENCES "movimiento_inventario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saldo_inventario" ADD CONSTRAINT "saldo_inventario_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variante_sku"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saldo_inventario" ADD CONSTRAINT "saldo_inventario_ubicacion_id_fkey" FOREIGN KEY ("ubicacion_id") REFERENCES "ubicacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

