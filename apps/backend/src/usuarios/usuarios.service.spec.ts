import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsuariosService — protección del último ADMIN activo', () => {
  let service: UsuariosService;
  let prisma: {
    usuario: {
      findUnique: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
      delete: jest.Mock;
    };
  };

  const ADMIN_ACTIVO = {
    id: 'admin-1',
    nombre: 'Único Admin',
    email: 'admin@test.com',
    rol: 'ADMIN',
    activo: true,
    _count: { movimientos: 0 },
  };

  beforeEach(async () => {
    prisma = {
      usuario: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
        count: jest.fn(),
        delete: jest.fn().mockResolvedValue({}),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
  });

  describe('update', () => {
    it('rechaza degradar de rol al único ADMIN activo', async () => {
      prisma.usuario.findUnique.mockResolvedValue(ADMIN_ACTIVO);
      prisma.usuario.count.mockResolvedValue(0); // sin otros admins activos

      await expect(
        service.update(ADMIN_ACTIVO.id, { rol: 'VENDEDOR' as any }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.usuario.update).not.toHaveBeenCalled();
    });

    it('rechaza desactivar al único ADMIN activo vía update', async () => {
      prisma.usuario.findUnique.mockResolvedValue(ADMIN_ACTIVO);
      prisma.usuario.count.mockResolvedValue(0);

      await expect(
        service.update(ADMIN_ACTIVO.id, { activo: false }),
      ).rejects.toThrow(BadRequestException);
    });

    it('permite degradar a un ADMIN si existe otro ADMIN activo', async () => {
      prisma.usuario.findUnique.mockResolvedValue(ADMIN_ACTIVO);
      prisma.usuario.count.mockResolvedValue(1); // hay otro admin activo

      await expect(
        service.update(ADMIN_ACTIVO.id, { rol: 'VENDEDOR' as any }),
      ).resolves.toBeDefined();
      expect(prisma.usuario.update).toHaveBeenCalled();
    });

    it('permite actualizar campos no sensibles del único ADMIN sin verificar nada', async () => {
      prisma.usuario.findUnique.mockResolvedValue(ADMIN_ACTIVO);

      await service.update(ADMIN_ACTIVO.id, { nombre: 'Nuevo Nombre' });

      expect(prisma.usuario.count).not.toHaveBeenCalled();
      expect(prisma.usuario.update).toHaveBeenCalled();
    });
  });

  describe('toggleActivo', () => {
    it('rechaza desactivar al único ADMIN activo', async () => {
      prisma.usuario.findUnique.mockResolvedValue(ADMIN_ACTIVO);
      prisma.usuario.count.mockResolvedValue(0);

      await expect(service.toggleActivo(ADMIN_ACTIVO.id)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('permite reactivar a un ADMIN inactivo sin verificar nada', async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        ...ADMIN_ACTIVO,
        activo: false,
      });

      await service.toggleActivo(ADMIN_ACTIVO.id);

      expect(prisma.usuario.count).not.toHaveBeenCalled();
      expect(prisma.usuario.update).toHaveBeenCalled();
    });

    it('permite desactivar a un vendedor sin restricción', async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        ...ADMIN_ACTIVO,
        rol: 'VENDEDOR',
      });

      await service.toggleActivo(ADMIN_ACTIVO.id);

      expect(prisma.usuario.count).not.toHaveBeenCalled();
      expect(prisma.usuario.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('rechaza eliminar al único ADMIN activo', async () => {
      prisma.usuario.findUnique.mockResolvedValue(ADMIN_ACTIVO);
      prisma.usuario.count.mockResolvedValue(0);

      await expect(service.remove(ADMIN_ACTIVO.id)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.usuario.delete).not.toHaveBeenCalled();
    });

    it('permite eliminar a un ADMIN si existe otro ADMIN activo', async () => {
      prisma.usuario.findUnique.mockResolvedValue(ADMIN_ACTIVO);
      prisma.usuario.count.mockResolvedValue(1);

      await service.remove(ADMIN_ACTIVO.id);

      expect(prisma.usuario.delete).toHaveBeenCalled();
    });
  });
});
