import { IsNotEmpty, IsString, IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoriaDto {
  @ApiProperty({ description: 'Nombre de la categoría', example: 'Camisetas' })
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiPropertyOptional({ description: 'Descripción de la categoría', example: 'Camisetas casuales y formales' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ description: 'ID de la categoría padre (para subcategorías)', example: 'uuid' })
  @IsOptional()
  @IsString()
  categoriaPadreId?: string;

  @ApiPropertyOptional({ description: 'Si la categoría está activa', default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
