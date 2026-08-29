import { Injectable, UnauthorizedException, ConflictException, OnModuleInit, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.seedDefaultAdmin();
  }

  /**
   * Garantiza la existencia de un usuario Administrador por defecto para acceso inicial
   */
  async seedDefaultAdmin() {
    try {
      const adminExists = await this.prisma.usuario.findFirst({
        where: { rol: 'ADMIN' as any },
      });

      if (!adminExists) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await this.prisma.usuario.create({
          data: {
            nombre: 'Administrador Principal',
            email: 'admin@tienda360.com',
            passwordHash: hashedPassword,
            rol: 'ADMIN' as any,
            activo: true,
          },
        });
        this.logger.log('✅ Usuario Administrador por defecto creado: admin@tienda360.com / admin123');
      }

      const clienteExists = await this.prisma.usuario.findFirst({
        where: { email: 'cliente@tienda360.com' },
      });

      if (!clienteExists) {
        const hashedClientPassword = await bcrypt.hash('cliente123', 10);
        await this.prisma.usuario.create({
          data: {
            nombre: 'Cliente Tienda',
            email: 'cliente@tienda360.com',
            passwordHash: hashedClientPassword,
            rol: 'CLIENTE' as any,
            activo: true,
          },
        });
        this.logger.log('✅ Usuario Cliente por defecto creado: cliente@tienda360.com / cliente123');
      }
    } catch (error) {
      this.logger.warn('Aviso al verificar/crear usuarios por defecto: ' + error.message);
    }
  }

  /**
   * Registro de nuevos usuarios con contraseña hasheada en bcrypt
   */
  async register(registerDto: RegisterDto) {
    const { nombre, email, password, rol } = registerDto;

    // Verificar si el correo ya está registrado
    const existingUser = await this.prisma.usuario.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new ConflictException('El correo electrónico ya se encuentra registrado');
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Si es el primer usuario de la base de datos, asignarle rol ADMIN automáticamente
    const userCount = await this.prisma.usuario.count();
    const assignedRole = userCount === 0 ? 'ADMIN' : (rol || 'VENDEDOR');

    // Crear usuario
    const newUser = await this.prisma.usuario.create({
      data: {
        nombre: nombre.trim(),
        email: email.toLowerCase().trim(),
        passwordHash: hashedPassword,
        rol: assignedRole as any,
        activo: true,
      },
    });

    // Generar JWT para login inmediato
    const payload = {
      sub: newUser.id,
      email: newUser.email,
      rol: newUser.rol,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      user: {
        id: newUser.id,
        nombre: newUser.nombre,
        email: newUser.email,
        rol: newUser.rol,
      },
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m'),
    };
  }

  /**
   * Inicio de sesión con verificación de credenciales
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Buscar usuario por correo
    const user = await this.prisma.usuario.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // REGLA DE SEGURIDAD (SRS v1.1 / Sección 6.5): Respuesta uniforme ante usuario no existente o password incorrecta
    if (!user || !user.activo) {
      throw new UnauthorizedException('Credenciales de acceso inválidas');
    }

    // Verificar contraseña con bcrypt
    let isPasswordValid = false;
    if (user.passwordHash.startsWith('$2b$') || user.passwordHash.startsWith('$2a$')) {
      isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    } else {
      // Fallback para usuarios iniciales o semillas en texto plano en desarrollo
      isPasswordValid = password === user.passwordHash;
    }

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales de acceso inválidas');
    }

    // Payload de JWT
    const payload = {
      sub: user.id,
      email: user.email,
      rol: user.rol,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      },
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m'),
    };
  }
}
