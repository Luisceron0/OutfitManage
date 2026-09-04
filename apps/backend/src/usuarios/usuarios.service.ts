import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, Rol } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto, RolEnum } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { QueryUsuarioDto } from './dto/query-usuario.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  /**
   * Impide dejar el sistema sin ningún ADMIN activo: rechaza degradar, desactivar o eliminar
   * al último administrador activo restante (ver hallazgo SEC-14 de la auditoría).
   */
  private async assertNotLastActiveAdmin(userId: string, accion: string) {
    const otrosAdminsActivos = await this.prisma.usuario.count({
      where: { rol: Rol.ADMIN, activo: true, NOT: { id: userId } },
    });
    if (otrosAdminsActivos === 0) {
      throw new BadRequestException(
        `No se puede ${accion} al único administrador activo del sistema. Crea o activa otro ADMIN primero.`,
      );
    }
  }

  /**
   * Listado paginado y filtrado de usuarios registrados con métricas
   */
  async findAll(query: QueryUsuarioDto) {
    const { page = 1, limit = 50, search, rol } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UsuarioWhereInput = {};

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { nombre: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ];
    }

    if (rol) {
      where.rol = Rol[rol];
    }

    const [items, total, countAdmin, countCliente, countVendedor, countBodega] =
      await Promise.all([
        this.prisma.usuario.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
            activo: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                movimientos: true,
              },
            },
          },
        }),
        this.prisma.usuario.count({ where }),
        this.prisma.usuario.count({ where: { rol: Rol.ADMIN } }),
        this.prisma.usuario.count({ where: { rol: Rol.CLIENTE } }),
        this.prisma.usuario.count({ where: { rol: Rol.VENDEDOR } }),
        this.prisma.usuario.count({ where: { rol: Rol.BODEGA } }),
      ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      stats: {
        totalUsuarios: total,
        totalAdmins: countAdmin,
        totalClientes: countCliente,
        totalStaff: countVendedor + countBodega,
      },
    };
  }

  /**
   * Obtener un usuario por su ID
   */
  async findOne(id: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            movimientos: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user;
  }

  /**
   * Crear un nuevo usuario manualmente desde el panel de administración
   */
  async create(dto: CreateUsuarioDto) {
    const existing = await this.prisma.usuario.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictException(
        'El correo electrónico ya está registrado en la plataforma',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.usuario.create({
      data: {
        nombre: dto.nombre.trim(),
        email: dto.email.toLowerCase().trim(),
        passwordHash: hashedPassword,
        rol: Rol[dto.rol || RolEnum.CLIENTE],
        activo: dto.activo !== undefined ? dto.activo : true,
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Actualizar datos, rol o contraseña de un usuario
   */
  async update(id: string, dto: UpdateUsuarioDto) {
    const user = await this.prisma.usuario.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    const dataToUpdate: Prisma.UsuarioUpdateInput = {};

    if (dto.nombre) {
      dataToUpdate.nombre = dto.nombre.trim();
    }

    if (dto.email && dto.email.toLowerCase().trim() !== user.email) {
      const emailTaken = await this.prisma.usuario.findUnique({
        where: { email: dto.email.toLowerCase().trim() },
      });
      if (emailTaken) {
        throw new ConflictException(
          'El correo electrónico ya está en uso por otro usuario',
        );
      }
      dataToUpdate.email = dto.email.toLowerCase().trim();
    }

    if (dto.password) {
      dataToUpdate.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const dejaDeSerAdminActivo =
      user.rol === Rol.ADMIN &&
      user.activo &&
      ((dto.rol && dto.rol !== RolEnum.ADMIN) || dto.activo === false);

    if (dejaDeSerAdminActivo) {
      await this.assertNotLastActiveAdmin(id, 'modificar el rol o desactivar');
    }

    if (dto.rol) {
      dataToUpdate.rol = Rol[dto.rol];
    }

    if (dto.activo !== undefined) {
      dataToUpdate.activo = dto.activo;
    }

    return this.prisma.usuario.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Alternar estado activo / inactivo de un usuario
   */
  async toggleActivo(id: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    if (user.rol === Rol.ADMIN && user.activo) {
      await this.assertNotLastActiveAdmin(id, 'desactivar');
    }

    return this.prisma.usuario.update({
      where: { id },
      data: {
        activo: !user.activo,
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Eliminar usuario
   */
  async remove(id: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id },
      include: {
        _count: {
          select: { movimientos: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    if (user._count.movimientos > 0) {
      throw new BadRequestException(
        `No se puede eliminar el usuario porque tiene ${user._count.movimientos} movimientos de inventario registrados. En su lugar, desactiva la cuenta.`,
      );
    }

    if (user.rol === Rol.ADMIN && user.activo) {
      await this.assertNotLastActiveAdmin(id, 'eliminar');
    }

    await this.prisma.usuario.delete({
      where: { id },
    });

    return { message: `Usuario ${user.nombre} eliminado exitosamente` };
  }
}
