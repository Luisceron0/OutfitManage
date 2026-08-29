import { IsOptional, IsString, IsUUID, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryCatalogoDto {
  @ApiPropertyOptional({ description: 'Filtrar por ID de categoría', example: 'uuid' })
  @IsOptional()
  @IsString()
  categoria?: string;

  @ApiPropertyOptional({ description: 'Filtrar por talla (ej: S, M, L, XL, 32, 38)', example: 'M' })
  @IsOptional()
  @IsString()
  talla?: string;

  @ApiPropertyOptional({ description: 'Filtrar por color', example: 'Negro' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Búsqueda por nombre o descripción', example: 'Camiseta' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Número de página', default: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Cantidad de productos por página', default: 12, example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
