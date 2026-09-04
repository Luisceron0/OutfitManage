import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedRequest } from '../types/authenticated-request';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Fail-closed: un endpoint protegido por este guard sin decorador @Roles se deniega, no se
    // permite. Un guard que abre por defecto ante metadata ausente es indistinguible de no tener
    // guard, y un @Roles olvidado por error deja de ser una fuga silenciosa de datos internos.
    if (!requiredRoles || requiredRoles.length === 0) {
      throw new ForbiddenException(
        'Endpoint sin matriz de roles declarada (@Roles) — acceso denegado por defecto',
      );
    }

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!user || !user.rol) {
      throw new ForbiddenException(
        'Acceso denegado: Usuario no autenticado o sin rol asignado',
      );
    }

    const hasPermission = requiredRoles.includes(user.rol);
    if (!hasPermission) {
      throw new ForbiddenException(
        `Acceso denegado: El rol '${user.rol}' no tiene permisos para esta acción`,
      );
    }

    return true;
  }
}
