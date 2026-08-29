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
    // De lo contrario, cae en JWT_SECRET como fallback seguro de desarrollo.
    const publicKey = configService.get<string>('JWT_PUBLIC_KEY');
    const secret = configService.get<string>('JWT_SECRET') || 'tienda360_default_dev_secret_key_change_in_prod';

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: publicKey || secret,
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
