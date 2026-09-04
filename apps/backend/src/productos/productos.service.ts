import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, MovimientoTipo } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

type PrismaClientOrTx = PrismaService | Prisma.TransactionClient;

// El timeout por defecto de Prisma (5s) se agota fácilmente en una transacción con varias
// escrituras secuenciales (producto + imágenes + variantes + precios + stock) contra una base
// de datos remota con latencia de red real — verificado en runtime contra Supabase (pooler en
// otra región): con 1 sola variante ya tomó 5.16s y disparó P2028 "Transaction already closed".
const TRANSACTION_OPTIONS = { timeout: 20000 };

@Injectable()
export class ProductosService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  async create(dto: CreateProductoDto, usuarioId: string) {
    // 1. Validar categoría
    const categoria = await this.prisma.categoria.findUnique({
      where: { id: dto.categoriaId },
    });
    if (!categoria) {
      throw new NotFoundException(
        `Categoría con ID ${dto.categoriaId} no encontrada`,
      );
    }

    // 2. Validar que no haya SKUs duplicados en base de datos
    const skuCodes = dto.variantes.map((v) => v.skuCode);
    const uniqueCodes = new Set(skuCodes);
    if (uniqueCodes.size !== skuCodes.length) {
      throw new BadRequestException(
        'Existen códigos SKU duplicados en la lista de variantes enviada',
      );
    }

    const existingSku = await this.prisma.varianteSku.findFirst({
      where: { skuCode: { in: skuCodes } },
    });
    if (existingSku) {
      throw new ConflictException(
        `El SKU '${existingSku.skuCode}' ya existe en el sistema`,
      );
    }

    // 3. Crear Producto, Imágenes, Variantes, Precios y Stock Inicial en una transacción atómica
    return this.prisma.$transaction(async (tx) => {
      const producto = await tx.producto.create({
        data: {
          nombre: dto.nombre,
          descripcion: dto.descripcion,
          categoriaId: dto.categoriaId,
          visiblePublico: dto.visiblePublico ?? false,
        },
      });

      // Guardar imágenes de producto general (sin varianteId)
      if (dto.imagenes && dto.imagenes.length > 0) {
        for (let i = 0; i < dto.imagenes.length; i++) {
          await tx.imagenProducto.create({
            data: {
              productoId: producto.id,
              urlStorage: dto.imagenes[i],
              orden: i,
            },
          });
        }
      }

      for (const varianteDto of dto.variantes) {
        const variante = await tx.varianteSku.create({
          data: {
            productoId: producto.id,
            skuCode: varianteDto.skuCode,
            talla: varianteDto.talla,
            color: varianteDto.color,
            atributoOpcional: varianteDto.atributoOpcional,
            barcode: varianteDto.barcode,
          },
        });

        // Guardar galería multimedia de la variante
        const mediaList =
          varianteDto.imagenes && varianteDto.imagenes.length > 0
            ? varianteDto.imagenes
            : varianteDto.imagenUrl
              ? [varianteDto.imagenUrl]
              : [];

        for (let idx = 0; idx < mediaList.length; idx++) {
          await tx.imagenProducto.create({
            data: {
              productoId: producto.id,
              varianteId: variante.id,
              urlStorage: mediaList[idx],
              orden: idx,
            },
          });
        }

        // Precio inicial vigente
        await tx.precioHistorico.create({
          data: {
            varianteId: variante.id,
            precio: varianteDto.precio,
          },
        });

        // Stock inicial opcional
        if (varianteDto.stockInicial && Number(varianteDto.stockInicial) > 0) {
          let ubicacionId = varianteDto.ubicacionInicialId;
          if (!ubicacionId) {
            const defaultUbi = await tx.ubicacion.findFirst({
              orderBy: { createdAt: 'asc' },
            });
            ubicacionId = defaultUbi?.id;
          }

          if (ubicacionId) {
            // Autoría del movimiento: siempre el usuario autenticado que crea el producto,
            // nunca un usuario arbitrario resuelto por antigüedad (ver hallazgo FUN-02).
            await tx.saldoInventario.upsert({
              where: {
                varianteId_ubicacionId: {
                  varianteId: variante.id,
                  ubicacionId,
                },
              },
              update: {
                cantidad: { increment: Number(varianteDto.stockInicial) },
              },
              create: {
                varianteId: variante.id,
                ubicacionId,
                cantidad: Number(varianteDto.stockInicial),
              },
            });

            await tx.movimientoInventario.create({
              data: {
                varianteId: variante.id,
                ubicacionId,
                tipo: MovimientoTipo.ENTRADA,
                cantidad: Number(varianteDto.stockInicial),
                motivo: 'Inventario inicial al registrar prenda',
                usuarioId,
                idempotencyKey: `init-${variante.id}-${Date.now()}-${Math.random()
                  .toString(36)
                  .substring(2, 7)}`,
              },
            });
          }
        }
      }

      // Lectura final con el propio cliente de la transacción: this.prisma es una conexión
      // distinta y no vería estas filas todavía sin confirmar (ver hallazgo FUN-01).
      return this.findOne(producto.id, tx);
    }, TRANSACTION_OPTIONS);
  }

  async findAll(page = 1, limit = 50, categoriaId?: string, search?: string) {
    // Cota superior fija: sin ella, page/limit sin validar en el controlador llegarían tal cual
    // a skip/take de Prisma (ver hallazgo SEC-12 de la auditoría).
    const take = Math.min(Math.max(Math.trunc(limit) || 50, 1), 100);
    const currentPage = Math.max(Math.trunc(page) || 1, 1);
    const skip = (currentPage - 1) * take;
    page = currentPage;
    limit = take;
    const where: Prisma.ProductoWhereInput = {};

    if (categoriaId) {
      where.categoriaId = categoriaId;
    }

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
        {
          variantes: {
            some: { skuCode: { contains: search, mode: 'insensitive' } },
          },
        },
      ];
    }

    const [productos, total] = await Promise.all([
      this.prisma.producto.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          categoria: { select: { id: true, nombre: true } },
          imagenes: {
            where: { varianteId: null },
            orderBy: { orden: 'asc' },
          },
          variantes: {
            include: {
              imagenes: { orderBy: { orden: 'asc' } },
              precios: {
                where: { vigenteHasta: null },
                orderBy: { vigenteDesde: 'desc' },
                take: 1,
              },
              saldos: {
                include: {
                  ubicacion: { select: { id: true, nombre: true, tipo: true } },
                },
              },
            },
          },
          _count: { select: { variantes: true } },
        },
      }),
      this.prisma.producto.count({ where }),
    ]);

    // Resolver URLs firmadas para producto general y para cada variante
    const items = await Promise.all(
      productos.map(async (p) => {
        const imagenesFirmadas = await Promise.all(
          p.imagenes.map(async (img) => ({
            id: img.id,
            urlStorage: await this.storageService.resolveSignedMediaUrl(
              img.urlStorage,
            ),
            tipo: this.storageService.getMediaType(img.urlStorage),
            orden: img.orden,
          })),
        );

        const variantesConImg = await Promise.all(
          p.variantes.map(async (v) => {
            const varImgsFirmadas = await Promise.all(
              (v.imagenes || []).map(async (img) => ({
                id: img.id,
                urlStorage: await this.storageService.resolveSignedMediaUrl(
                  img.urlStorage,
                ),
                tipo: this.storageService.getMediaType(img.urlStorage),
                orden: img.orden,
              })),
            );

            return {
              ...v,
              imagenes: varImgsFirmadas,
              imagenUrl: varImgsFirmadas[0]?.urlStorage || null,
            };
          }),
        );

        return {
          ...p,
          imagenes: imagenesFirmadas,
          variantes: variantesConImg,
        };
      }),
    );

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, client: PrismaClientOrTx = this.prisma) {
    const producto = await client.producto.findUnique({
      where: { id },
      include: {
        categoria: { select: { id: true, nombre: true } },
        variantes: {
          include: {
            imagenes: { orderBy: { orden: 'asc' } },
            precios: {
              orderBy: { vigenteDesde: 'desc' },
            },
            saldos: {
              include: {
                ubicacion: { select: { id: true, nombre: true, tipo: true } },
              },
            },
          },
        },
        imagenes: {
          where: { varianteId: null },
          orderBy: { orden: 'asc' },
        },
      },
    });

    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    const imagenesFirmadas = await Promise.all(
      producto.imagenes.map(async (img) => ({
        id: img.id,
        urlStorage: await this.storageService.resolveSignedMediaUrl(
          img.urlStorage,
        ),
        tipo: this.storageService.getMediaType(img.urlStorage),
        orden: img.orden,
      })),
    );

    const variantesConImg = await Promise.all(
      producto.variantes.map(async (v) => {
        const varImgsFirmadas = await Promise.all(
          (v.imagenes || []).map(async (img) => ({
            id: img.id,
            urlStorage: await this.storageService.resolveSignedMediaUrl(
              img.urlStorage,
            ),
            tipo: this.storageService.getMediaType(img.urlStorage),
            orden: img.orden,
          })),
        );

        return {
          ...v,
          imagenes: varImgsFirmadas,
          imagenUrl: varImgsFirmadas[0]?.urlStorage || null,
        };
      }),
    );

    return {
      ...producto,
      imagenes: imagenesFirmadas,
      variantes: variantesConImg,
    };
  }

  async update(id: string, dto: UpdateProductoDto) {
    await this.findOne(id);

    const { imagenes, variantes, ...productoData } = dto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Actualizar datos base
      if (Object.keys(productoData).length > 0) {
        await tx.producto.update({
          where: { id },
          data: productoData,
        });
      }

      // 2. Si vienen nuevas imágenes generales de producto
      if (imagenes !== undefined) {
        await tx.imagenProducto.deleteMany({
          where: { productoId: id, varianteId: null },
        });

        for (let i = 0; i < imagenes.length; i++) {
          await tx.imagenProducto.create({
            data: {
              productoId: id,
              urlStorage: imagenes[i],
              orden: i,
            },
          });
        }
      }

      // 3. Procesar variantes
      if (variantes && variantes.length > 0) {
        for (const v of variantes) {
          const mediaList =
            v.imagenes !== undefined
              ? v.imagenes
              : v.imagenUrl !== undefined
                ? v.imagenUrl
                  ? [v.imagenUrl]
                  : []
                : null;

          if (v.id) {
            // Variante existente
            await tx.varianteSku.update({
              where: { id: v.id },
              data: {
                skuCode: v.skuCode,
                talla: v.talla,
                color: v.color,
                atributoOpcional: v.atributoOpcional,
                barcode: v.barcode,
                activo: v.activo !== undefined ? v.activo : true,
              },
            });

            // Actualizar galería de la variante si se envió
            if (mediaList !== null) {
              await tx.imagenProducto.deleteMany({
                where: { varianteId: v.id },
              });

              for (let idx = 0; idx < mediaList.length; idx++) {
                await tx.imagenProducto.create({
                  data: {
                    productoId: id,
                    varianteId: v.id,
                    urlStorage: mediaList[idx],
                    orden: idx,
                  },
                });
              }
            }

            // Precio vigente
            if (v.precio !== undefined) {
              const precioActual = await tx.precioHistorico.findFirst({
                where: { varianteId: v.id, vigenteHasta: null },
                orderBy: { vigenteDesde: 'desc' },
              });

              if (
                !precioActual ||
                Number(precioActual.precio) !== Number(v.precio)
              ) {
                if (precioActual) {
                  await tx.precioHistorico.update({
                    where: { id: precioActual.id },
                    data: { vigenteHasta: new Date() },
                  });
                }

                await tx.precioHistorico.create({
                  data: {
                    varianteId: v.id,
                    precio: v.precio,
                  },
                });
              }
            }
          } else {
            // Nueva variante
            const nuevaVariante = await tx.varianteSku.create({
              data: {
                productoId: id,
                skuCode: v.skuCode,
                talla: v.talla,
                color: v.color,
                atributoOpcional: v.atributoOpcional,
                barcode: v.barcode,
              },
            });

            if (mediaList && mediaList.length > 0) {
              for (let idx = 0; idx < mediaList.length; idx++) {
                await tx.imagenProducto.create({
                  data: {
                    productoId: id,
                    varianteId: nuevaVariante.id,
                    urlStorage: mediaList[idx],
                    orden: idx,
                  },
                });
              }
            }

            if (v.precio !== undefined) {
              await tx.precioHistorico.create({
                data: {
                  varianteId: nuevaVariante.id,
                  precio: v.precio,
                },
              });
            }
          }
        }
      }

      return this.findOne(id, tx);
    }, TRANSACTION_OPTIONS);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.producto.delete({
      where: { id },
    });
  }
}
