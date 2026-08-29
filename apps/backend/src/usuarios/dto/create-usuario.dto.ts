import { IsString, IsEmail, IsNotEmpty, MinLength, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum RolEnum {
  ADMIN = 'ADMIN',
  VENDEDOR = 'VENDEDOR',
  BODEGA = 'BODEGA',
  CLIENTE = 'CLIENTE',
}

export class CreateUsuarioDto {
  @ApiProperty({ description: 'Nombre completo del usuario', example: 'Carlos Mendoza' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre: string;

  @ApiProperty({ description: 'Correo electrónico único', example: 'carlos@empresa.com' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  email: string;

  @ApiProperty({ description: 'Contraseña de acceso', minLength: 6, example: 'Segura123*' })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contraseña debe contener al menos 6 caracteres' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password: string;

  @ApiPropertyOptional({
    description: 'Rol en el sistema',
    enum: RolEnum,
    default: RolEnum.CLIENTE,
  })
  @IsOptional()
  @IsEnum(RolEnum, { message: 'El rol debe ser ADMIN, VENDEDOR, BODEGA o CLIENTE' })
  rol?: RolEnum;

  @ApiPropertyOptional({ description: 'Estado activo o inactivo', default: true })
  @IsOptional()
  @IsBoolean({ message: 'El campo activo debe ser booleano' })
  activo?: boolean;
}
