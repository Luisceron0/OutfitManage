import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Autenticación')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Máximo 5 intentos por minuto por IP contra ataques de fuerza bruta (SRS 6.5 / 7 T-005)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({
    summary: 'Iniciar sesión',
    description: 'Verifica credenciales (email y password) y retorna token JWT Bearer. Protegido con Rate Limiting (5 intentos/min).',
  })
  @ApiResponse({ status: 200, description: 'Inicio de sesión exitoso con token JWT' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @ApiResponse({ status: 429, description: 'Demasiados intentos. Intenta más tarde.' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } }) // Máximo 3 registros por minuto por IP
  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  @ApiOperation({
    summary: 'Registrar nuevo usuario',
    description: 'Crea una nueva cuenta de usuario con contraseña hasheada y retorna token JWT inicial.',
  })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente' })
  @ApiResponse({ status: 409, description: 'El correo electrónico ya existe' })
  @ApiResponse({ status: 429, description: 'Demasiados intentos. Intenta más tarde.' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener perfil del usuario autenticado',
    description: 'Retorna los datos del usuario extraídos del token JWT actual.',
  })
  @ApiResponse({ status: 200, description: 'Perfil de usuario autenticado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  getProfile(@Request() req: any) {
    return req.user;
  }
}
