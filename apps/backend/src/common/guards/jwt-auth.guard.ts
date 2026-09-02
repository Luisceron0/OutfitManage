import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedUser } from '../types/authenticated-request';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  // Firma genérica <TUser> requerida para ser compatible con IAuthGuard.handleRequest de
  // Passport; se le da el default concreto AuthenticatedUser para los call sites normales.
  handleRequest<TUser = AuthenticatedUser>(
    err: Error | null,
    user: AuthenticatedUser | false,
  ): TUser {
    if (err || !user) {
      throw (
        err || new UnauthorizedException('Token de acceso inválido o expirado')
      );
    }
    return user as TUser;
  }
}
