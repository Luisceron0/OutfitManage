import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUbicacionDto } from './dto/create-ubicacion.dto';
import { UpdateUbicacionDto } from './dto/update-ubicacion.dto';

@Injectable()
export class UbicacionesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUbicacionDto) {
    return this.prisma.ubicacion.create({
      data: {
        nombre: dto.nombre,
        tipo: dto.tipo,
        direccion: dto.direccion,
        activo: dto.activo ?? true,
      },
    });
  }

  async findAll() {
    return this.prisma.ubicacion.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: string) {
    const ubicacion = await this.prisma.ubicacion.findUnique({
      where: { id },
    });
    if (!ubicacion) {
      throw new NotFoundException(`Ubicación con ID ${id} no encontrada`);
    }
    return ubicacion;
  }

  async update(id: string, dto: UpdateUbicacionDto) {
    await this.findOne(id);
    return this.prisma.ubicacion.update({
      where: { id },
      data: {
        nombre: dto.nombre,
        tipo: dto.tipo,
        direccion: dto.direccion,
        activo: dto.activo,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    // Verificar si tiene saldo positivo
    const tieneStock = await this.prisma.saldoInventario.findFirst({
      where: { ubicacionId: id, cantidad: { gt: 0 } },
    });
    if (tieneStock) {
      throw new BadRequestException('No se puede eliminar una sede que tiene prendas en stock. Traslada el inventario primero.');
    }

    // Soft delete para mantener auditoría de movimientos históricos
    return this.prisma.ubicacion.update({
      where: { id },
      data: { activo: false },
    });
  }
}
