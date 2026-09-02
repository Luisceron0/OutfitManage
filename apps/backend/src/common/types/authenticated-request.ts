import type { Request } from 'express';
import type { Rol } from '@prisma/client';

// Forma exacta que JwtStrategy.validate() adjunta a la request (ver
// common/strategies/jwt.strategy.ts) — reemplaza los `@Req() req: any` sueltos por controlador.
export interface AuthenticatedUser {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
