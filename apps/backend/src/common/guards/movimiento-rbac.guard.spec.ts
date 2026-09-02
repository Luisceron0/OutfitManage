import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { MovimientoRbacGuard } from './movimiento-rbac.guard';

function buildContext(user: any, tipo: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user, body: { tipo } }),
    }),
  } as unknown as ExecutionContext;
}

describe('MovimientoRbacGuard', () => {
  const guard = new MovimientoRbacGuard();

  // Matriz de permisos por tipo de movimiento — SRS RF-006 / copilot-instructions.md
  const permitido: Array<[string, string]> = [
    ['ENTRADA', 'ADMIN'],
    ['ENTRADA', 'BODEGA'],
    ['SALIDA', 'ADMIN'],
    ['SALIDA', 'VENDEDOR'],
    ['AJUSTE', 'ADMIN'],
    ['AJUSTE', 'BODEGA'],
    ['TRASLADO', 'ADMIN'],
    ['TRASLADO', 'BODEGA'],
    ['DEVOLUCION', 'ADMIN'],
    ['DEVOLUCION', 'VENDEDOR'],
  ];

  const denegado: Array<[string, string]> = [
    ['ENTRADA', 'VENDEDOR'],
    ['ENTRADA', 'CLIENTE'],
    ['SALIDA', 'BODEGA'],
    ['AJUSTE', 'VENDEDOR'],
    ['TRASLADO', 'VENDEDOR'],
    ['DEVOLUCION', 'BODEGA'],
  ];

  it.each(permitido)('permite %s a rol %s', (tipo, rol) => {
    expect(guard.canActivate(buildContext({ rol }, tipo))).toBe(true);
  });

  it.each(denegado)('deniega %s a rol %s', (tipo, rol) => {
    expect(() => guard.canActivate(buildContext({ rol }, tipo))).toThrow(
      ForbiddenException,
    );
  });

  it('deniega (fail-closed) un tipo de movimiento desconocido', () => {
    expect(() =>
      guard.canActivate(buildContext({ rol: 'ADMIN' }, 'INEXISTENTE')),
    ).toThrow(ForbiddenException);
  });

  it('deniega cuando no hay usuario autenticado', () => {
    expect(() => guard.canActivate(buildContext(undefined, 'ENTRADA'))).toThrow(
      ForbiddenException,
    );
  });
});
