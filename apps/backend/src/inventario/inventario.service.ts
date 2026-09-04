import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { MovimientoTipo, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateMovimientoDto,
  MovimientoTipoDto,
} from './dto/create-movimiento.dto';
import { QueryStockDto } from './dto/query-stock.dto';

// Tipos de movimiento que restan del saldo de la ubicación de origen (ADR-003).
// AJUSTE se trata como corrección a la baja (faltante detectado en conteo físico),
// que es el único caso de ajuste que admite el DTO actual (cantidad siempre positiva, sin signo).
const TIPOS_QUE_DECREMENTAN: MovimientoTipoDto[] = [
  MovimientoTipoDto.SALIDA,
  MovimientoTipoDto.AJUSTE,
  MovimientoTipoDto.TRASLADO,
];

const MAX_LIMIT = 100;

// Ver la misma nota en productos.service.ts: el timeout por defecto de Prisma (5s) es
// insuficiente contra una base de datos remota con latencia de red real.
const TRANSACTION_OPTIONS = { timeout: 20000 };

@Injectable()
export class InventarioService {
  constructor(private prisma: PrismaService) {}

  /**
   * Registra un movimiento de inventario en el ledger inmutable y recalcula el saldo
   * materializado en la misma transacción (ADR-003), con deduplicación por Idempotency-Key (ADR-004).
   */
  async createMovimiento(
    dto: CreateMovimientoDto,
    usuarioId: string,
    idempotencyKey: string,
  ) {
    if (!idempotencyKey || !idempotencyKey.trim()) {
      throw new BadRequestException(
        'El header idempotency-key es obligatorio para registrar movimientos de inventario',
      );
    }

    if (dto.tipo === MovimientoTipoDto.TRASLADO && !dto.ubicacionDestinoId) {
      throw new BadRequestException(
        'El traslado requiere especificar ubicacionDestinoId',
      );
    }

    if (
      (dto.tipo === MovimientoTipoDto.AJUSTE ||
        dto.tipo === MovimientoTipoDto.DEVOLUCION) &&
      !dto.motivo?.trim()
    ) {
      throw new BadRequestException(
        'El motivo es obligatorio para movimientos de tipo AJUSTE o DEVOLUCION',
      );
    }

    const existente = await this.prisma.movimientoInventario.findUnique({
      where: { idempotencyKey },
    });

    if (existente) {
      const mismoPayload =
        existente.varianteId === dto.varianteId &&
        existente.ubicacionId === dto.ubicacionId &&
        (existente.ubicacionDestinoId || null) ===
          (dto.ubicacionDestinoId || null) &&
        existente.tipo === MovimientoTipo[dto.tipo] &&
        existente.cantidad === dto.cantidad;

      if (!mismoPayload) {
        throw new ConflictException(
          'La Idempotency-Key ya fue usada con un payload de movimiento distinto',
        );
      }

      return this.buildMovimientoResponse(existente.id);
    }

    const variante = await this.prisma.varianteSku.findUnique({
      where: { id: dto.varianteId },
    });
    if (!variante) {
      throw new NotFoundException(
        `Variante con ID ${dto.varianteId} no encontrada`,
      );
    }

    const ubicacion = await this.prisma.ubicacion.findUnique({
      where: { id: dto.ubicacionId },
    });
    if (!ubicacion) {
      throw new NotFoundException(
        `Ubicación con ID ${dto.ubicacionId} no encontrada`,
      );
    }

    if (dto.tipo === MovimientoTipoDto.TRASLADO) {
      const destino = await this.prisma.ubicacion.findUnique({
        where: { id: dto.ubicacionDestinoId! },
      });
      if (!destino) {
        throw new NotFoundException(
          `Ubicación destino con ID ${dto.ubicacionDestinoId} no encontrada`,
        );
      }
    }

    const decrementaOrigen = TIPOS_QUE_DECREMENTAN.includes(dto.tipo);

    const movimientoId = await this.prisma.$transaction(async (tx) => {
      if (decrementaOrigen) {
        const saldoOrigen = await tx.saldoInventario.findUnique({
          where: {
            varianteId_ubicacionId: {
              varianteId: dto.varianteId,
              ubicacionId: dto.ubicacionId,
            },
          },
        });
        const disponible = saldoOrigen?.cantidad ?? 0;
        if (disponible < dto.cantidad) {
          throw new UnprocessableEntityException({
            error: 'insufficient_stock',
            message: `Stock insuficiente: disponible ${disponible}, solicitado ${dto.cantidad}`,
            disponible,
            solicitado: dto.cantidad,
          });
        }
      }

      const movimiento = await tx.movimientoInventario.create({
        data: {
          varianteId: dto.varianteId,
          ubicacionId: dto.ubicacionId,
          ubicacionDestinoId:
            dto.tipo === MovimientoTipoDto.TRASLADO
              ? dto.ubicacionDestinoId
              : null,
          tipo: MovimientoTipo[dto.tipo],
          cantidad: dto.cantidad,
          motivo: dto.motivo,
          usuarioId,
          idempotencyKey,
        },
      });

      const deltaOrigen = decrementaOrigen ? -dto.cantidad : dto.cantidad;
      await tx.saldoInventario.upsert({
        where: {
          varianteId_ubicacionId: {
            varianteId: dto.varianteId,
            ubicacionId: dto.ubicacionId,
          },
        },
        update: { cantidad: { increment: deltaOrigen } },
        create: {
          varianteId: dto.varianteId,
          ubicacionId: dto.ubicacionId,
          cantidad: Math.max(deltaOrigen, 0),
        },
      });

      if (dto.tipo === MovimientoTipoDto.TRASLADO && dto.ubicacionDestinoId) {
        await tx.saldoInventario.upsert({
          where: {
            varianteId_ubicacionId: {
              varianteId: dto.varianteId,
              ubicacionId: dto.ubicacionDestinoId,
            },
          },
          update: { cantidad: { increment: dto.cantidad } },
          create: {
            varianteId: dto.varianteId,
            ubicacionId: dto.ubicacionDestinoId,
            cantidad: dto.cantidad,
          },
        });
      }

      return movimiento.id;
    }, TRANSACTION_OPTIONS);

    return this.buildMovimientoResponse(movimientoId);
  }

  private async buildMovimientoResponse(movimientoId: string) {
    const movimiento = await this.prisma.movimientoInventario.findUnique({
      where: { id: movimientoId },
      include: {
        variante: {
          select: { id: true, skuCode: true, talla: true, color: true },
        },
        ubicacion: { select: { id: true, nombre: true, tipo: true } },
        ubicacionDestino: { select: { id: true, nombre: true, tipo: true } },
        usuario: { select: { id: true, nombre: true, rol: true } },
      },
    });

    const saldos = await this.prisma.saldoInventario.findMany({
      where: { varianteId: movimiento!.varianteId },
      include: {
        ubicacion: { select: { id: true, nombre: true, tipo: true } },
      },
    });

    return { movimiento, saldos };
  }

  /**
   * Historial paginado del ledger de movimientos, con límite superior fijo para evitar
   * que una paginación sin cota agote memoria o conexiones (ver hallazgo SEC-12).
   */
  async getMovimientos(page = 1, limit = 20, tipo?: string) {
    const take = Math.min(Math.max(Math.trunc(limit) || 20, 1), MAX_LIMIT);
    const currentPage = Math.max(Math.trunc(page) || 1, 1);
    const skip = (currentPage - 1) * take;

    const where: { tipo?: MovimientoTipo } = {};
    if (tipo && tipo !== 'TODOS' && tipo in MovimientoTipo) {
      where.tipo = MovimientoTipo[tipo as keyof typeof MovimientoTipo];
    }

    const [items, total] = await Promise.all([
      this.prisma.movimientoInventario.findMany({
        where,
        skip,
        take,
        orderBy: { timestamp: 'desc' },
        include: {
          variante: {
            select: { id: true, skuCode: true, talla: true, color: true },
          },
          ubicacion: { select: { id: true, nombre: true } },
          ubicacionDestino: { select: { id: true, nombre: true } },
          usuario: { select: { id: true, nombre: true, rol: true } },
        },
      }),
      this.prisma.movimientoInventario.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page: currentPage,
        limit: take,
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  }

  /**
   * Saldo de stock por variante/SKU con desglose por ubicación (RF-004). Requiere autenticación
   * en el controlador — este dato nunca es público.
   */
  async getStock(query: QueryStockDto) {
    if (!query.varianteId && !query.sku) {
      throw new BadRequestException(
        'Debes indicar varianteId o sku para consultar el stock',
      );
    }

    const variante = await this.prisma.varianteSku.findFirst({
      where: query.varianteId
        ? { id: query.varianteId }
        : { skuCode: query.sku },
    });

    if (!variante) {
      throw new NotFoundException('Variante no encontrada');
    }

    const saldos = await this.prisma.saldoInventario.findMany({
      where: { varianteId: variante.id },
      include: {
        ubicacion: { select: { id: true, nombre: true, tipo: true } },
      },
    });

    const total = saldos.reduce((sum, s) => sum + s.cantidad, 0);

    return {
      varianteId: variante.id,
      skuCode: variante.skuCode,
      talla: variante.talla,
      color: variante.color,
      saldos,
      total,
    };
  }

  /**
   * Consulta rápida omnicanal por término libre (SKU, nombre, talla o color) con desglose
   * de stock por ubicación, para vendedores y bodega.
   */
  async buscarStockRapido(q?: string, categoriaId?: string) {
    const where: Prisma.VarianteSkuWhereInput = { activo: true };

    if (q && q.trim()) {
      const term = q.trim();
      where.OR = [
        { skuCode: { contains: term, mode: 'insensitive' } },
        { talla: { contains: term, mode: 'insensitive' } },
        { color: { contains: term, mode: 'insensitive' } },
        { producto: { nombre: { contains: term, mode: 'insensitive' } } },
      ];
    }

    if (categoriaId) {
      where.producto = { categoriaId };
    }

    const variantes = await this.prisma.varianteSku.findMany({
      where,
      take: 25,
      include: {
        producto: { select: { id: true, nombre: true } },
        saldos: {
          include: {
            ubicacion: { select: { id: true, nombre: true, tipo: true } },
          },
        },
      },
    });

    return variantes.map((v) => ({
      varianteId: v.id,
      skuCode: v.skuCode,
      talla: v.talla,
      color: v.color,
      producto: v.producto,
      stockTotal: v.saldos.reduce((sum, s) => sum + s.cantidad, 0),
      desglose: v.saldos.map((s) => ({
        ubicacionId: s.ubicacion.id,
        ubicacion: s.ubicacion.nombre,
        tipo: s.ubicacion.tipo,
        cantidad: s.cantidad,
      })),
    }));
  }

  /**
   * Métricas consolidadas para el panel de administración.
   */
  async getDashboardStats() {
    const [
      totalProductos,
      totalVariantes,
      saldos,
      ubicaciones,
      ultimosMovimientos,
    ] = await Promise.all([
      this.prisma.producto.count(),
      this.prisma.varianteSku.count({ where: { activo: true } }),
      this.prisma.saldoInventario.findMany({
        include: {
          ubicacion: { select: { id: true, nombre: true, tipo: true } },
        },
      }),
      this.prisma.ubicacion.findMany({
        where: { activo: true },
        select: { id: true, nombre: true, tipo: true },
      }),
      this.prisma.movimientoInventario.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' },
        include: {
          variante: { select: { skuCode: true, talla: true, color: true } },
          ubicacion: { select: { nombre: true } },
          usuario: { select: { nombre: true, rol: true } },
        },
      }),
    ]);

    const stockTotal = saldos.reduce((sum, s) => sum + s.cantidad, 0);

    const resumenPorUbicacion = ubicaciones.map((u) => ({
      ubicacionId: u.id,
      nombre: u.nombre,
      tipo: u.tipo,
      stock: saldos
        .filter((s) => s.ubicacionId === u.id)
        .reduce((sum, s) => sum + s.cantidad, 0),
    }));

    return {
      totalProductos,
      totalVariantes,
      stockTotal,
      resumenPorUbicacion,
      ultimosMovimientos,
    };
  }
}
