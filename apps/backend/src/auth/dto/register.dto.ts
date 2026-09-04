import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// El registro público (`POST /api/auth/register`, sin autenticación) nunca acepta un rol del
// cliente: crearía escalada de privilegios directa. Todo usuario que se auto-registra es CLIENTE.
// La asignación de roles de personal (ADMIN, VENDEDOR, BODEGA) es exclusiva de
// `POST /api/usuarios`, que ya exige rol ADMIN (SRS RF-006).
export class RegisterDto {
  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Carlos Gómez',
  })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString()
  nombre: string;

  @ApiProperty({
    description: 'Correo electrónico único',
    example: 'cliente@tienda360.com',
  })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  @IsEmail({}, { message: 'El formato de email no es válido' })
  email: string;

  @ApiProperty({
    description: 'Contraseña de acceso (mínimo 6 caracteres)',
    example: 'cliente123',
  })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}
