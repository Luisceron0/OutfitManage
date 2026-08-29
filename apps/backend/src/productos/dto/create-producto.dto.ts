import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVarianteDto {
  @ApiProperty({ description: 'Código SKU único', example: 'CAM-NEG-M' })
  @IsNotEmpty()
  @IsString()
  skuCode: string;

  @ApiProperty({ description: 'Talla', example: 'M' })
  @IsNotEmpty()
  @IsString()
  talla: string;

  @ApiProperty({ description: 'Color', example: 'Negro' })
  @IsNotEmpty()
  @IsString()
  color: string;

  @ApiPropertyOptional({ description: 'Atributo adicional (material, estilo, etc.)', example: 'Algodón' })
  @IsOptional()
  @IsString()
  atributoOpcional?: string;

  @ApiPropertyOptional({ description: 'URL de foto o video específico de esta variante', example: 'products_images/123.jpg' })
  @IsOptional()
  @IsString()
  imagenUrl?: string;

  @ApiPropertyOptional({ description: 'URLs de fotos y videos de la variante', example: ['products_images/1.jpg', 'products_images/2.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imagenes?: string[];

  @ApiPropertyOptional({ description: 'Código de barras', example: '7701234567890' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({ description: 'Precio inicial de la variante', example: 45000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  precio: number;

  @ApiPropertyOptional({ description: 'Stock inicial de la variante', example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockInicial?: number;

  @ApiPropertyOptional({ description: 'ID de la ubicación para el stock inicial', example: 'uuid' })
  @IsOptional()
  @IsString()
  ubicacionInicialId?: string;
}

export class CreateProductoDto {
  @ApiProperty({ description: 'Nombre del producto', example: 'Camiseta Básica' })
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiPropertyOptional({ description: 'Descripción del producto', example: 'Camiseta de algodón 100%' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ description: 'ID de la categoría', example: 'uuid' })
  @IsNotEmpty()
  @IsString()
  categoriaId: string;

  @ApiPropertyOptional({ description: 'Visible en catálogo público', default: false })
  @IsOptional()
  @IsBoolean()
  visiblePublico?: boolean;

  @ApiPropertyOptional({
    description: 'URLs o rutas en Supabase Storage de imágenes/videos del producto',
    example: ['products_images/123.jpg'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imagenes?: string[];

  @ApiProperty({ description: 'Lista de variantes (SKUs) del producto', type: [CreateVarianteDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVarianteDto)
  variantes: CreateVarianteDto[];
}
