import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryStockDto {
  @ApiPropertyOptional({
    description: 'ID de la variante SKU',
    example: 'uuid',
  })
  @IsOptional()
  @IsString()
  varianteId?: string;

  @ApiPropertyOptional({ description: 'Código SKU', example: 'CAM-NEG-M' })
  @IsOptional()
  @IsString()
  sku?: string;
}
