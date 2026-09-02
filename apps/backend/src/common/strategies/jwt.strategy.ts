import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  rol: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    // Si JWT_PUBLIC_KEY existe (RS256), usa la clave pública en formato PEM.
    // De lo contrario, requiere JWT_SECRET explícito — sin valor por defecto embebido
    // (ver auth.module.ts, que ya falla en el arranque si ninguno está configurado).
    const publicKey = configService.get<string>('JWT_PUBLIC_KEY');
    const secret = configService.get<string>('JWT_SECRET');

    if (!publicKey && !secret) {
      throw new Error(
        'JWT_SECRET o JWT_PUBLIC_KEY deben estar configurados. No hay valor por defecto.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: (publicKey || secret) as string,
      algorithms: publicKey ? ['RS256'] : ['HS256'],
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
      },
    });

    if (!user || !user.activo) {
      throw new UnauthorizedException('Usuario inactivo o inexistente');
    }

    return user;
  }
}
