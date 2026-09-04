import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../types/authenticated-request';

// Los guards corren antes que el ValidationPipe (que recién transforma el body en un
// CreateMovimientoDto), así que aquí el body sigue siendo el JSON crudo — se tipa solo el
// campo que este guard necesita leer.
interface RequestWithMovimientoBody extends AuthenticatedRequest {
  body: { tipo?: string };
}

/**
 * Matriz de permisos por tipo de movimiento — fuente de verdad: SRS RF-006 / copilot-instructions.md.
 * Implementada como guard reutilizable (no como `if` disperso en el servicio o el controlador).
 */
const MATRIZ_PERMISOS_MOVIMIENTO: Record<string, string[]> = {
  ENTRADA: ['ADMIN', 'BODEGA'],
  SALIDA: ['ADMIN', 'VENDEDOR'],
  AJUSTE: ['ADMIN', 'BODEGA'],
  TRASLADO: ['ADMIN', 'BODEGA'],
  DEVOLUCION: ['ADMIN', 'VENDEDOR'],
};

@Injectable()
export class MovimientoRbacGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithMovimientoBody>();
    const { user, body } = request;
    const tipo = body?.tipo ?? '';

    const rolesPermitidos = MATRIZ_PERMISOS_MOVIMIENTO[tipo];
    if (!rolesPermitidos) {
      // Un tipo inválido lo rechaza el ValidationPipe antes de llegar aquí en el flujo normal;
      // si de algún modo llega, se deniega por defecto (fail-closed).
      throw new ForbiddenException(
        `Tipo de movimiento '${tipo}' no reconocido`,
      );
    }

    if (!user?.rol || !rolesPermitidos.includes(user.rol)) {
      throw new ForbiddenException(
        `El rol '${user?.rol}' no tiene permiso para registrar movimientos de tipo '${tipo}' (matriz RF-006)`,
      );
    }

    return true;
  }
}
