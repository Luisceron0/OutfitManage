import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateVarianteDto {
  @ApiPropertyOptional({
    description: 'ID de la variante existente (omitir para nuevas)',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({
    description: 'Código SKU único',
    example: 'CAM-NEG-M',
  })
  @IsNotEmpty()
  @IsString()
  skuCode: string;

  @ApiPropertyOptional({ description: 'Talla', example: 'M' })
  @IsNotEmpty()
  @IsString()
  talla: string;

  @ApiPropertyOptional({ description: 'Color', example: 'Negro' })
  @IsNotEmpty()
  @IsString()
  color: string;

  @ApiPropertyOptional({ description: 'Atributo adicional' })
  @IsOptional()
  @IsString()
  atributoOpcional?: string;

  @ApiPropertyOptional({
    description: 'URL de foto o video específico de esta variante',
  })
  @IsOptional()
  @IsString()
  imagenUrl?: string;

  @ApiPropertyOptional({ description: 'URLs de fotos y videos de la variante' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imagenes?: string[];

  @ApiPropertyOptional({ description: 'Código de barras' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ description: 'Precio vigente en COP', example: 50000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  precio?: number;

  @ApiPropertyOptional({
    description: 'Estado activo de la variante',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class UpdateProductoDto {
  @ApiPropertyOptional({
    description: 'Nombre del producto',
    example: 'Camiseta Premium',
  })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({ description: 'Descripción del producto' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ description: 'ID de la categoría' })
  @IsOptional()
  @IsString()
  categoriaId?: string;

  @ApiPropertyOptional({ description: 'Visible en catálogo público' })
  @IsOptional()
  @IsBoolean()
  visiblePublico?: boolean;

  @ApiPropertyOptional({
    description: 'Lista de URLs o rutas en Supabase Storage',
    example: ['products_images/123.jpg'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imagenes?: string[];

  @ApiPropertyOptional({
    description: 'Lista de variantes para actualizar o agregar',
    type: [UpdateVarianteDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateVarianteDto)
  variantes?: UpdateVarianteDto[];
}
