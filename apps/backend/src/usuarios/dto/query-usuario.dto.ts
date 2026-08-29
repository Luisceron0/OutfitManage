import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RolEnum } from './create-usuario.dto';

export class QueryUsuarioDto {
  @ApiPropertyOptional({ description: 'Página para paginación', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Límite de elementos por página', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 50;

  @ApiPropertyOptional({ description: 'Término de búsqueda por nombre o correo electrónico' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrar por rol', enum: RolEnum })
  @IsOptional()
  @IsEnum(RolEnum)
  rol?: RolEnum;
}
