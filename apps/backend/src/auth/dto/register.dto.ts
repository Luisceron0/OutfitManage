import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UserRoleDto {
  ADMIN = 'ADMIN',
  VENDEDOR = 'VENDEDOR',
  BODEGA = 'BODEGA',
  CLIENTE = 'CLIENTE',
}

export class RegisterDto {
  @ApiProperty({ description: 'Nombre completo del usuario', example: 'Carlos Gómez' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString()
  nombre: string;

  @ApiProperty({ description: 'Correo electrónico único', example: 'cliente@tienda360.com' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  @IsEmail({}, { message: 'El formato de email no es válido' })
  email: string;

  @ApiProperty({ description: 'Contraseña de acceso (mínimo 6 caracteres)', example: 'cliente123' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiPropertyOptional({
    description: 'Rol del usuario en el sistema',
    enum: UserRoleDto,
    default: UserRoleDto.CLIENTE,
    example: UserRoleDto.CLIENTE,
  })
  @IsOptional()
  @IsEnum(UserRoleDto, { message: 'El rol debe ser ADMIN, VENDEDOR, BODEGA o CLIENTE' })
  rol?: UserRoleDto = UserRoleDto.CLIENTE;
}
