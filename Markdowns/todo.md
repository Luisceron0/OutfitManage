# Plan de Desarrollo Tienda360 (SRS v1.1)

## Fase 1: Fundación + Identidad
- [x] Inicializar monorepo (pnpm workspaces + Turborepo): `apps/backend` (NestJS), `apps/web-catalogo` (Next.js), `apps/web-admin` (Next.js), `packages/api-client`
- [x] Configurar repositorio, linter, formateo, TypeScript monorepo
- [x] Crear modelo de base de datos PostgreSQL + Prisma (`schema.prisma`) con las 9 entidades oficiales: `Ubicacion`, `Usuario`, `Categoria`, `Producto`, `ImagenProducto`, `VarianteSku`, `PrecioHistorico`, `MovimientoInventario`, `SaldoInventario`
- [x] Implementar autenticación: login (`POST /api/auth/login`), registro (`POST /api/auth/register`), emisión de JWT, anti-enumeración uniforme
- [x] Implementar RBAC: decorador `@Roles(...)` y guardia `RbacGuard` que verifica permisos en `/api/*`
- [x] Configurar gestión de secrets (`ConfigModule` + `.env`) — cero secrets hardcodeados
- [x] Documentación OpenAPI / Swagger configurada en `/api/docs`

---

## Fase 2: Dominio Core — Inventario
- [x] Módulo de Categorías (`POST /api/categorias`, `GET /api/categorias`, `GET /api/categorias/:id`) con jerarquías
- [x] Módulo de Ubicaciones (`POST /api/ubicaciones`, `GET /api/ubicaciones`, `GET /api/ubicaciones/:id`) para bodegas y tiendas
- [x] Módulo de Productos y Variantes (`POST /api/productos`, `GET /api/productos`, `GET /api/productos/:id`, `PATCH /api/productos/:id`) con creación transaccional de variantes (SKU) y precio vigente (ADR-002)
- [x] Módulo de Inventario (`POST /api/inventario/movimientos`, `GET /api/inventario/stock`):
  - [x] Registro ledger-based inmutable de movimientos (`entrada`, `salida`, `ajuste`, `traslado`, `devolucion`) con autoría (ADR-003)
  - [x] Idempotencia con deduplicación server-side por `Idempotency-Key` (ADR-004)
  - [x] Actualización transaccional atómica de `saldo_inventario` materializado
  - [x] Matriz RBAC estricta por tipo de movimiento (SRS 6.5)
  - [x] Endpoint de métricas consolidadas `GET /api/inventario/dashboard/stats`

---

## Fase 3: Catálogo Público (Vitrina Virtual)
- [x] Backend: Superficie de API pública `/public/*` desacoplada (ADR-001):
  - [x] `GET /public/catalogo`: listado con filtros (`categoria`, `talla`, `color`, `q`) y disponibilidad booleana sin exponer stock exacto ni costos
  - [x] `GET /public/productos/:id`: ficha pública con imágenes, variantes y generación server-side de `whatsapp_link`
  - [x] `GET /public/categorias`: categorías activas con conteo de prendas
- [x] Frontend: Aplicación Web Catálogo en Next.js (`apps/web-catalogo`):
  - [x] Header sticky con atención directa por WhatsApp y branding
  - [x] Banner Hero de temporada
  - [x] Navegación interactiva por categorías (CategoryNav)
  - [x] Barra de búsqueda y filtros reactivos por talla y color
  - [x] Grid de prendas con badges de disponibilidad y precios formateados en COP
  - [x] Página de detalle de producto (`/producto/[id]`) con galería de imágenes, selector de talla/color dinámico y botón de pedido por WhatsApp
  - [x] Footer con garantías, horarios y canales oficiales
  - [x] Optimización SEO (OpenGraph, meta tags dinámicos)

---

## Fase 4: Web Admin (Gestión de Inventario de Escritorio)
- [x] Autenticación: Pantallas de Login y Registro (`/login`, `/register`) con soporte de roles (`ADMIN`, `VENDEDOR`, `BODEGA`)
- [x] Dashboard General (`/`): Métricas de stock consolidado, productos, SKUs activos, desglose por almacén y últimos movimientos
- [x] Gestor de Productos & SKUs (`/productos`): Listado con filtros y modal para crear producto con múltiples variantes de talla/color y precio vigente
- [x] Consola de Movimientos Ledger (`/inventario`): Registro de Entrada, Salida, Traslado y Ajuste con generación automática de `Idempotency-Key`
- [x] Explorador de Existencias (`/stock`): Consulta de saldo por SKU discriminado por bodega y tienda
- [x] Configuración de Almacenes y Categorías (`/configuracion`): Formularios de creación y gestión

---

## Fase 4B: App Móvil PWA Multiplataforma (iOS & Android)
- [x] Configuración de Manifiesto Web Nativo (`manifest.ts` / `/manifest.webmanifest`)
- [x] Generación de íconos PWA de alta resolución (192x192, 512x512, maskable y apple-touch-icon 180x180)
- [x] Soporte de modo pantalla completa (*standalone*) para iOS Safari y Android Chrome
- [x] Service Worker (`sw.js` & `PwaRegister.tsx`) con caché de assets estáticos y resiliencia offline

---

## Fase 5: Devoluciones, Gestión de Imágenes & Hardening de Seguridad
- [x] Gestión de Almacenamiento e Imágenes: `StorageModule` con subida, sanitización, URLs firmadas y eliminación segura en Supabase Storage
- [x] Registro y Trazabilidad de Devoluciones: Movimientos de devolución con motivo obligatorio en Kardex y Terminal de Ventas
- [x] Hardening de Seguridad y Rate Limiting:
  - [x] `@nestjs/throttler` configurado globalmente (100 req/min general)
  - [x] Protección agresiva contra fuerza bruta en `/api/auth/login` (máximo 5 intentos/min por IP) y `/api/auth/register` (3 intentos/min)
  - [x] Respuesta uniforme anti-enumeración de credenciales
- [x] Adaptación Responsive Mobile & Paginación Dinámica en todas las tablas del panel administrativo

---

## Próximas Fases
- [ ] Fase 6: Empaquetado de despliegue IaC (Docker / Cloud Platform: Vercel + Render/Railway + Supabase PostgreSQL)

---

> **Estado del Proyecto (Actualizado):**
> - ✅ **Fase 1 a Fase 5 Completadas al 100% y Verificadas.**
> - 📱 **PWA & Mobile Ready:** Probado e instalado exitosamente en dispositivos móviles con soporte standalone, service workers, proxy interno de red local y renderizado WebGL/Bento optimizado a 60 FPS.
> - 🛡️ **Seguridad & Rendimiento:** Rate limiting con throttler, blindaje anti-fuerza bruta, CORS dinámico y proxy de rewrites en Next.js.



