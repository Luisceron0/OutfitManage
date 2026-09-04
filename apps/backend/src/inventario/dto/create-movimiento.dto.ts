import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MovimientoTipoDto {
  ENTRADA = 'ENTRADA',
  SALIDA = 'SALIDA',
  AJUSTE = 'AJUSTE',
  TRASLADO = 'TRASLADO',
  DEVOLUCION = 'DEVOLUCION',
}

export class CreateMovimientoDto {
  @ApiProperty({ description: 'ID de la variante SKU', example: 'uuid' })
  @IsNotEmpty()
  @IsString()
  varianteId: string;

  @ApiProperty({ description: 'ID de la ubicación origen', example: 'uuid' })
  @IsNotEmpty()
  @IsString()
  ubicacionId: string;

  @ApiPropertyOptional({
    description: 'ID de la ubicación destino (solo para TRASLADO)',
    example: 'uuid',
  })
  @IsOptional()
  @IsString()
  ubicacionDestinoId?: string;

  @ApiProperty({
    description: 'Tipo de movimiento',
    enum: MovimientoTipoDto,
    example: 'ENTRADA',
  })
  @IsNotEmpty()
  @IsEnum(MovimientoTipoDto)
  tipo: MovimientoTipoDto;

  @ApiProperty({ description: 'Cantidad (positivo)', example: 10 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  cantidad: number;

  @ApiPropertyOptional({
    description: 'Motivo (obligatorio para AJUSTE y DEVOLUCION)',
    example: 'Faltante en conteo físico',
  })
  @IsOptional()
  @IsString()
  motivo?: string;
}
