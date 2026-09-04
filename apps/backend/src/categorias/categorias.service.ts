import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';

@Injectable()
export class CategoriasService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoriaDto) {
    if (dto.categoriaPadreId) {
      const padre = await this.prisma.categoria.findUnique({
        where: { id: dto.categoriaPadreId },
      });
      if (!padre) {
        throw new NotFoundException(
          `Categoría padre con ID ${dto.categoriaPadreId} no encontrada`,
        );
      }
    }

    return this.prisma.categoria.create({
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        categoriaPadreId: dto.categoriaPadreId,
        activo: dto.activo ?? true,
      },
      include: { subcategorias: true },
    });
  }

  async findAll() {
    return this.prisma.categoria.findMany({
      where: { categoriaPadreId: null, activo: true },
      include: {
        subcategorias: {
          where: { activo: true },
          include: {
            subcategorias: { where: { activo: true } },
          },
        },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: string) {
    const categoria = await this.prisma.categoria.findUnique({
      where: { id },
      include: {
        subcategorias: { where: { activo: true } },
        productos: { select: { id: true, nombre: true } },
      },
    });
    if (!categoria) {
      throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
    }
    return categoria;
  }

  async update(id: string, dto: UpdateCategoriaDto) {
    await this.findOne(id);
    return this.prisma.categoria.update({
      where: { id },
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        categoriaPadreId: dto.categoriaPadreId,
        activo: dto.activo,
      },
    });
  }

  async remove(id: string) {
    const categoria = await this.findOne(id);

    const prodsCount = await this.prisma.producto.count({
      where: { categoriaId: id },
    });
    if (prodsCount > 0) {
      throw new BadRequestException(
        `No se puede eliminar la categoría "${categoria.nombre}" porque tiene ${prodsCount} prenda(s) asignadas. Reasigna las prendas primero.`,
      );
    }

    return this.prisma.categoria.update({
      where: { id },
      data: { activo: false },
    });
  }
}
