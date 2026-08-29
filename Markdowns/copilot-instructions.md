# Instrucciones para GitHub Copilot

## Contexto del proyecto

Sistema de catálogo virtual web (vitrina pública, sin checkout, contacto por WhatsApp) + gestor de inventario web y móvil (offline-first) sobre un backend compartido, para tiendas de ropa. Cada cliente recibe una **instalación dedicada** (infraestructura propia, no multi-tenant). El gestor de inventario solo registra movimientos de stock — no hay punto de venta ni facturación electrónica en esta fase (ver ADR-006 del SRS).

Usuarios: dueño/admin de tienda, vendedor, personal de bodega (roles internos autenticados), y público general (solo lectura del catálogo, sin autenticación).

Documento fuente de verdad: `SRS.md` en la raíz del repo. Ante cualquier ambigüedad de comportamiento, el SRS manda sobre la intuición del código existente.

## Stack tecnológico

- **Monorepo:** pnpm workspaces + Turborepo (ADR-007 del SRS)
- **Backend:** Node.js LTS + TypeScript + NestJS
- **Base de datos:** PostgreSQL 15+, ORM con queries parametrizadas (nunca concatenación de strings)
- **Frontend catálogo público:** Next.js (SSR/SSG)
- **Frontend web admin (inventario):** Next.js — mismo framework que el catálogo, apps separadas dentro del monorepo
- **App móvil (inventario):** React Native + Expo, con Expo SQLite para cola offline
- **Paquete compartido:** `@core/api-client` — tipos generados desde OpenAPI + lógica de negocio común (generación de Idempotency-Key, validación de payload) consumida por web admin y móvil
- **Storage de imágenes:** Cloudinary (ADR-008 del SRS) — nunca implementar pipeline propia de resize/optimización, usar transformación por parámetro de URL de Cloudinary
- **CI/CD:** GitHub Actions
- **Despliegue:** Docker Compose + script de IaC (Ansible o Terraform, a definir en Fase de build 6) por instalación — nunca configuración manual

## Principios de código

1. **El SKU es la unidad de inventario, nunca el producto.** Todo código que toque stock opera sobre `variante_id`, jamás sobre `producto_id` directamente.
2. **El stock nunca se edita — se calcula.** Ninguna función escribe directamente sobre `SaldoInventario`. Todo cambio de stock pasa por insertar un `MovimientoInventario` y recalcular el saldo en la misma transacción.
3. **Todo movimiento de inventario es inmutable.** No hay UPDATE ni DELETE sobre `movimiento_inventario`. Una corrección es un movimiento nuevo que referencia al original (`movimiento_referencia_id`).
4. **Toda escritura desde la app móvil requiere Idempotency-Key.** Rechazar con 400 cualquier POST de inventario sin ese header.
5. **Los contratos `/public/*` y `/api/*` son DTOs distintos, nunca el mismo objeto serializado condicionalmente.** Si necesitás agregar un campo a la respuesta pública, agregalo explícitamente al DTO público — nunca reutilices el DTO interno con un flag.
6. **Simplicidad antes que abstracción especulativa.** No introducir capas, patrones o generalización que el SRS no pida. Si dudás si algo es necesario, no lo es todavía.
7. **Ningún dato deriva su seguridad de estar "oculto" en el frontend.** Toda autorización se verifica en el backend, siempre.

## Patrones de arquitectura obligatorios

- Monolito modular con separación de dominios: `catalogo/`, `inventario/`, `identidad/` como módulos independientes dentro del mismo proceso (ADR-001 del SRS)
- Dos superficies de API: `/public/*` (sin autenticación, sin datos sensibles) y `/api/*` (autenticada, RBAC verificado por endpoint)
- Capa de repositorio para acceso a datos — sin queries SQL sueltas en controladores/servicios
- Un archivo de migración por cambio de schema, nunca editar una migración ya aplicada en otra instalación

## Seguridad — reglas no negociables

- **Headers HTTP son input no confiable.** `User-Agent`, `Referer`, `X-Forwarded-For`, `X-Real-IP`, `Host`, `Cookie`, `Accept-Language`, headers custom: nunca se concatenan en SQL, comandos, paths o templates. Toda escritura a DB derivada de un header (incluido logging) usa prepared statements. `Host` se valida contra allowlist.
- **Prepared statements siempre**, sin excepción, incluidas las escrituras de logging/analytics.
- **RBAC verificado en cada endpoint de `/api/*`** — nunca confiar en que el frontend oculta un botón.
- **JWT:** RS256, access token 15-30 min, refresh token con rotación. Nunca `alg: none`, nunca HS256 con secret débil.
- **Rate limiting** obligatorio en `/api/auth/login` (bloqueo progresivo por IP y cuenta) y en `/public/*` (anti-scraping).
- **Carga de archivos:** validar tipo MIME real (no extensión) antes de firmar el upload a Cloudinary — nunca confiar en el tipo declarado por el cliente ni delegar esa validación solo al proveedor externo.
- **Matriz de permisos por rol (fuente de verdad — Sección 4/RF-006 del SRS):**

  | Acción | Admin | Vendedor | Bodega |
  |---|---|---|---|
  | Ver costo/margen/proveedor | ✅ | ❌ | ❌ |
  | Consultar stock (sin costo) | ✅ | ✅ | ✅ |
  | Entrada | ✅ | ❌ | ✅ |
  | Salida | ✅ | ✅ | ❌ |
  | Ajuste | ✅ | ❌ | ✅ |
  | Traslado | ✅ | ❌ | ✅ |
  | Devolución/cambio de talla | ✅ | ✅ | ❌ |
  | Gestión de catálogo | ✅ | ❌ | ❌ |
  | Gestión de usuarios | ✅ | ❌ | ❌ |

  Esta tabla se implementa como guard/decorador reutilizable en NestJS, nunca como `if` disperso por controlador.
- **Secrets:** nunca hardcodeados, nunca en el repositorio, siempre vía variables de entorno o vault.
- **Respuesta uniforme** ante login fallido (usuario no existe = password incorrecta), previene enumeración.
- Antes de cerrar cualquier PR que toque autenticación, autorización o el endpoint público del catálogo: **security review obligatorio**, sin excepción.

## Gestión de tareas

- Leer `tasks/todo.md` al iniciar cualquier sesión de trabajo — no proponer trabajo nuevo sin verificar el estado activo primero.
- Al completar una tarea, marcarla y actualizar la sección "Revisión" del plan activo.
- Si se descubre un patrón de error reincidente o una lección de diseño, agregarla a `tasks/lessons.md` con el formato definido ahí — no dejarla solo en un comentario de código.
- Si un control de seguridad del SRS no es implementable tal como está especificado: no omitirlo en silencio, no implementar una versión reducida sin documentarlo. Crear issue `security-gap` describiendo qué no es implementable, el riesgo resultante, y una mitigación compensatoria propuesta. Asignar al Tech Lead antes de hacer el PR.

## Workflow de desarrollo

- Seguir el Build Order de la Sección 9B del SRS — no construir catálogo público antes que el módulo de inventario esté completo, porque el catálogo depende de saldo real para mostrar disponibilidad.
- Cada fase de build entrega algo verificable de punta a punta, no solo infraestructura aislada.
- Bug encontrado en producción o en review: documentar en `tasks/lessons.md` antes de cerrar el fix, no solo corregir y seguir.
- Definición de Done: ver Sección 9 del SRS — no marcar una tarea completa sin los criterios de verificación explícitos ahí listados.

## Comandos del entorno

- Instalar dependencias: `pnpm install`
- Tests (todo el monorepo): `pnpm turbo run test`
- Tests (un paquete): `pnpm --filter <nombre-paquete> test`
- Lint: `pnpm turbo run lint`
- Build: `pnpm turbo run build`
- CI: GitHub Actions, trigger en push y pull request a `main` — pipeline corre lint, tests, dependency scanning y secrets scanning antes de permitir merge

## Límites y claridad

- Copilot **no** implementa punto de venta, facturación electrónica DIAN, ni checkout/pago online — está explícitamente fuera de alcance (ADR-006 del SRS). Si una tarea pide esto, señalarlo y pedir confirmación antes de proceder.
- Copilot **no** introduce multi-tenancy a nivel de infraestructura o base de datos — cada instalación es dedicada por diseño (ADR-005).
- Ante cualquier duda sobre qué campo es público vs interno, revisar la Sección 6.5 del SRS (Contratos de API) antes de asumir.
- No instalar plugins/skills de dominio ajeno (SEO, marketing) en este pipeline de arquitectura-seguridad.
