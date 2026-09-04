import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacGuard } from './rbac.guard';

function buildContext(user: any): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('RbacGuard', () => {
  let reflector: Reflector;
  let guard: RbacGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RbacGuard(reflector);
  });

  it('deniega por defecto (fail-closed) cuando el endpoint no declara @Roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(() => guard.canActivate(buildContext({ rol: 'ADMIN' }))).toThrow(
      ForbiddenException,
    );
  });

  it('deniega cuando la lista de roles requeridos está vacía', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);

    expect(() => guard.canActivate(buildContext({ rol: 'ADMIN' }))).toThrow(
      ForbiddenException,
    );
  });

  it('deniega cuando no hay usuario autenticado en la request', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

    expect(() => guard.canActivate(buildContext(undefined))).toThrow(
      ForbiddenException,
    );
  });

  it('deniega cuando el rol del usuario no está en la lista permitida', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

    expect(() => guard.canActivate(buildContext({ rol: 'CLIENTE' }))).toThrow(
      ForbiddenException,
    );
  });

  it('permite cuando el rol del usuario está en la lista permitida', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['ADMIN', 'BODEGA']);

    expect(guard.canActivate(buildContext({ rol: 'BODEGA' }))).toBe(true);
  });
});
