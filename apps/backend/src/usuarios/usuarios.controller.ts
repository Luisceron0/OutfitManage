import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { QueryUsuarioDto } from './dto/query-usuario.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Usuarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Roles('ADMIN')
@Controller('api/usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar usuarios registrados',
    description:
      'Retorna usuarios con paginación, búsqueda por texto y filtros por rol. Exclusivo para administradores.',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de usuarios obtenido exitosamente',
  })
  findAll(@Query() query: QueryUsuarioDto) {
    return this.usuariosService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalle de un usuario',
    description: 'Retorna información completa del usuario por su UUID.',
  })
  @ApiResponse({ status: 200, description: 'Usuario encontrado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuariosService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Crear nuevo usuario',
    description:
      'Registra un usuario desde el panel administrativo asignando rol y contraseña.',
  })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  @ApiResponse({ status: 409, description: 'El correo electrónico ya existe' })
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuariosService.create(createUsuarioDto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar usuario',
    description:
      'Permite modificar nombre, email, rol, estado activo o restablecer la contraseña.',
  })
  @ApiResponse({ status: 200, description: 'Usuario actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
  ) {
    return this.usuariosService.update(id, updateUsuarioDto);
  }

  @Patch(':id/toggle-activo')
  @ApiOperation({
    summary: 'Alternar estado activo/inactivo',
    description: 'Activa o suspende el acceso del usuario a la plataforma.',
  })
  @ApiResponse({ status: 200, description: 'Estado del usuario actualizado' })
  toggleActivo(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuariosService.toggleActivo(id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar usuario',
    description:
      'Elimina un usuario si no cuenta con movimientos de inventario asociados.',
  })
  @ApiResponse({ status: 200, description: 'Usuario eliminado exitosamente' })
  @ApiResponse({
    status: 400,
    description: 'No se puede eliminar por tener movimientos asociados',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuariosService.remove(id);
  }
}
