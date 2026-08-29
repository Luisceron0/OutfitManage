import { IsString, IsEmail, MinLength, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RolEnum } from './create-usuario.dto';

export class UpdateUsuarioDto {
  @ApiPropertyOptional({ description: 'Nombre completo del usuario', example: 'Carlos Mendoza' })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  nombre?: string;

  @ApiPropertyOptional({ description: 'Correo electrónico único', example: 'carlos@empresa.com' })
  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email?: string;

  @ApiPropertyOptional({ description: 'Nueva contraseña opcional', minLength: 6, example: 'NuevaClave123*' })
  @IsOptional()
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contraseña debe contener al menos 6 caracteres' })
  password?: string;

  @ApiPropertyOptional({
    description: 'Rol en el sistema',
    enum: RolEnum,
  })
  @IsOptional()
  @IsEnum(RolEnum, { message: 'El rol debe ser ADMIN, VENDEDOR, BODEGA o CLIENTE' })
  rol?: RolEnum;

  @ApiPropertyOptional({ description: 'Estado activo o inactivo' })
  @IsOptional()
  @IsBoolean({ message: 'El campo activo debe ser booleano' })
  activo?: boolean;
}
