import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InventarioService } from './inventario.service';
import { PrismaService } from '../prisma/prisma.service';
import { MovimientoTipoDto } from './dto/create-movimiento.dto';

describe('InventarioService.createMovimiento', () => {
  let service: InventarioService;
  let prisma: any;

  const VARIANTE = { id: 'var-1' };
  const UBICACION_ORIGEN = { id: 'ubi-1' };
  const UBICACION_DESTINO = { id: 'ubi-2' };

  const baseDto = {
    varianteId: VARIANTE.id,
    ubicacionId: UBICACION_ORIGEN.id,
    tipo: MovimientoTipoDto.ENTRADA,
    cantidad: 10,
  };

  beforeEach(async () => {
    prisma = {
      varianteSku: { findUnique: jest.fn().mockResolvedValue(VARIANTE) },
      ubicacion: {
        findUnique: jest.fn((args: any) =>
          Promise.resolve(
            args.where.id === UBICACION_DESTINO.id
              ? UBICACION_DESTINO
              : UBICACION_ORIGEN,
          ),
        ),
      },
      movimientoInventario: {
        // Se usa para dos consultas distintas: la deduplicación por idempotencyKey (debe dar
        // null salvo que un test la sobreescriba) y la relectura post-transacción por id (debe
        // devolver el movimiento recién creado, con sus relaciones incluidas).
        findUnique: jest.fn().mockImplementation((args: any) => {
          if (args.where?.id) {
            return Promise.resolve({
              id: args.where.id,
              varianteId: VARIANTE.id,
              ...args.where,
            });
          }
          return Promise.resolve(null);
        }),
        create: jest
          .fn()
          .mockImplementation((args: any) =>
            Promise.resolve({ id: 'mov-1', ...args.data }),
          ),
      },
      saldoInventario: {
        findUnique: jest.fn().mockResolvedValue({ cantidad: 100 }),
        upsert: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest
        .fn()
        .mockImplementation((callback: any) => callback(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventarioService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<InventarioService>(InventarioService);
  });

  it('rechaza sin Idempotency-Key (obligatoria — copilot-instructions.md)', async () => {
    await expect(
      service.createMovimiento(baseDto, 'user-1', ''),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rechaza TRASLADO sin ubicacionDestinoId', async () => {
    await expect(
      service.createMovimiento(
        { ...baseDto, tipo: MovimientoTipoDto.TRASLADO },
        'user-1',
        'key-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it.each([MovimientoTipoDto.AJUSTE, MovimientoTipoDto.DEVOLUCION])(
    'rechaza %s sin motivo',
    async (tipo) => {
      await expect(
        service.createMovimiento(
          { ...baseDto, tipo, cantidad: 1 },
          'user-1',
          'key-1',
        ),
      ).rejects.toThrow(BadRequestException);
    },
  );

  it('deduplica por Idempotency-Key cuando el payload es idéntico (ADR-004)', async () => {
    prisma.movimientoInventario.findUnique.mockResolvedValue({
      id: 'mov-existente',
      varianteId: baseDto.varianteId,
      ubicacionId: baseDto.ubicacionId,
      ubicacionDestinoId: null,
      tipo: 'ENTRADA',
      cantidad: baseDto.cantidad,
    });

    const result = await service.createMovimiento(
      baseDto,
      'user-1',
      'key-repetida',
    );

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.movimientoInventario.create).not.toHaveBeenCalled();
    expect(result.movimiento).toBeDefined();
  });

  it('rechaza con 409 cuando la misma Idempotency-Key trae un payload distinto', async () => {
    prisma.movimientoInventario.findUnique.mockResolvedValue({
      id: 'mov-existente',
      varianteId: baseDto.varianteId,
      ubicacionId: baseDto.ubicacionId,
      ubicacionDestinoId: null,
      tipo: 'ENTRADA',
      cantidad: 999, // cantidad distinta a la del nuevo request
    });

    await expect(
      service.createMovimiento(baseDto, 'user-1', 'key-repetida'),
    ).rejects.toThrow(ConflictException);
    expect(prisma.movimientoInventario.create).not.toHaveBeenCalled();
  });

  it('rechaza SALIDA con stock insuficiente (422 insufficient_stock)', async () => {
    prisma.saldoInventario.findUnique.mockResolvedValue({ cantidad: 3 });

    await expect(
      service.createMovimiento(
        { ...baseDto, tipo: MovimientoTipoDto.SALIDA, cantidad: 10 },
        'user-1',
        'key-1',
      ),
    ).rejects.toThrow(UnprocessableEntityException);
    expect(prisma.movimientoInventario.create).not.toHaveBeenCalled();
  });

  it('registra ENTRADA e incrementa el saldo de la ubicación de origen', async () => {
    await service.createMovimiento(baseDto, 'user-1', 'key-1');

    expect(prisma.movimientoInventario.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          usuarioId: 'user-1',
          cantidad: 10,
          tipo: 'ENTRADA',
        }),
      }),
    );
    expect(prisma.saldoInventario.upsert).toHaveBeenCalledTimes(1);
    const [[upsertArgs]] = prisma.saldoInventario.upsert.mock.calls;
    expect(upsertArgs.update.cantidad.increment).toBe(10);
  });

  it('en TRASLADO decrementa el origen e incrementa el destino', async () => {
    await service.createMovimiento(
      {
        ...baseDto,
        tipo: MovimientoTipoDto.TRASLADO,
        ubicacionDestinoId: UBICACION_DESTINO.id,
        cantidad: 5,
      },
      'user-1',
      'key-1',
    );

    expect(prisma.saldoInventario.upsert).toHaveBeenCalledTimes(2);
    const [origenCall, destinoCall] =
      prisma.saldoInventario.upsert.mock.calls.map((c: any) => c[0]);
    expect(origenCall.update.cantidad.increment).toBe(-5);
    expect(destinoCall.update.cantidad.increment).toBe(5);
  });
});
