import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CatalogoService } from './catalogo.service';
import { QueryCatalogoDto } from './dto/query-catalogo.dto';

@ApiTags('Público - Catálogo')
@Controller('public')
export class CatalogoController {
  constructor(private readonly catalogoService: CatalogoService) {}

  @Get('catalogo')
  @ApiOperation({
    summary: 'Catálogo público de productos',
    description: 'Listado público de productos con filtros por categoría, talla, color y búsqueda. '
      + 'No requiere autenticación. Oculta cantidades de stock y costos por seguridad (SRS 6.5).',
  })
  @ApiResponse({ status: 200, description: 'Listado paginado de productos para vitrina' })
  getCatalogo(@Query() query: QueryCatalogoDto) {
    return this.catalogoService.getCatalogo(query);
  }

  @Get('productos/:id')
  @ApiOperation({
    summary: 'Ficha pública de producto',
    description: 'Detalle de producto con galería de imágenes, variantes disponibles y enlace directo a WhatsApp.',
  })
  @ApiResponse({ status: 200, description: 'Detalle de producto con WhatsApp link' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado o no visible' })
  getProductoDetalle(@Param('id') id: string) {
    return this.catalogoService.getProductoDetalle(id);
  }

  @Get('categorias')
  @ApiOperation({
    summary: 'Categorías para filtros del catálogo',
    description: 'Lista de categorías con conteo de productos visibles para renderizar menús de navegación.',
  })
  @ApiResponse({ status: 200, description: 'Lista de categorías públicas' })
  getCategoriasPublicas() {
    return this.catalogoService.getCategoriasPublicas();
  }
}
