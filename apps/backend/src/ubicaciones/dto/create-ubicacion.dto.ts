import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UbicacionTipoDto {
  BODEGA = 'BODEGA',
  TIENDA = 'TIENDA',
}

export class CreateUbicacionDto {
  @ApiProperty({
    description: 'Nombre de la ubicación',
    example: 'Bodega Principal',
  })
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiProperty({
    description: 'Tipo de ubicación',
    enum: UbicacionTipoDto,
    example: 'BODEGA',
  })
  @IsNotEmpty()
  @IsEnum(UbicacionTipoDto)
  tipo: UbicacionTipoDto;

  @ApiPropertyOptional({
    description: 'Dirección física',
    example: 'Calle 45 #12-34, Medellín',
  })
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiPropertyOptional({
    description: 'Si la ubicación está activa',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
