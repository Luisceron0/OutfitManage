import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UbicacionesService } from './ubicaciones.service';
import { CreateUbicacionDto } from './dto/create-ubicacion.dto';
import { UpdateUbicacionDto } from './dto/update-ubicacion.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Ubicaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Roles('ADMIN', 'VENDEDOR', 'BODEGA')
@Controller('api/ubicaciones')
export class UbicacionesController {
  constructor(private readonly ubicacionesService: UbicacionesService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Crear ubicación (solo ADMIN)' })
  create(@Body() dto: CreateUbicacionDto) {
    return this.ubicacionesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar ubicaciones activas' })
  findAll() {
    return this.ubicacionesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de ubicación por ID' })
  findOne(@Param('id') id: string) {
    return this.ubicacionesService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Actualizar ubicación (solo ADMIN)' })
  update(@Param('id') id: string, @Body() dto: UpdateUbicacionDto) {
    return this.ubicacionesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Eliminar ubicación (solo ADMIN)' })
  remove(@Param('id') id: string) {
    return this.ubicacionesService.remove(id);
  }
}
