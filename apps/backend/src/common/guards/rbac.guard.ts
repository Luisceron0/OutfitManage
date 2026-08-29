import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si el endpoint no especifica decorador @Roles, permite acceso por defecto a usuarios autenticados
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.rol) {
      throw new ForbiddenException('Acceso denegado: Usuario no autenticado o sin rol asignado');
    }

    const hasPermission = requiredRoles.includes(user.rol);
    if (!hasPermission) {
      throw new ForbiddenException(`Acceso denegado: El rol '${user.rol}' no tiene permisos para esta acción`);
    }

    return true;
  }
}
