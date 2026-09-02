# Lecciones aprendidas

## 2026-08-18 — Stock vive en el SKU, nunca en el producto
**Contexto:** Diseño inicial del modelo de datos para catálogo + inventario de ropa.
**Error cometido (evitado a tiempo):** Modelar el stock como columna directa de `Producto`, ignorando que en retail de ropa la unidad real de inventario es la combinación talla/color.
**Consecuencia:** Si se hubiera implementado así, el negocio no habría podido diferenciar disponibilidad por talla, y la migración posterior a variantes habría requerido reescribir catálogo, inventario, reportes y app móvil simultáneamente — migración destructiva bajo datos en producción.
**Corrección:** Modelo de `Variante` (SKU) como unidad de inventario desde el diseño (ADR-002 del SRS). `Producto` es solo agrupador de presentación.
**Regla para el futuro:** En cualquier dominio de retail con atributos variables (talla, color, tamaño, sabor, etc.), la unidad de inventario es siempre la combinación de atributos, nunca el producto genérico. Modelarlo así desde la primera migración.
**Tags:** #arquitectura #deuda-técnica

## 2026-08-18 — El stock se calcula, no se edita
**Contexto:** Diseño del mecanismo de actualización de inventario bajo concurrencia (web admin + app móvil escribiendo simultáneamente).
**Error cometido (evitado a tiempo):** Diseñar el stock como columna mutable actualizada con `UPDATE stock = stock - N`.
**Consecuencia potencial:** Condiciones de carrera bajo escritura concurrente (sobreventa), y pérdida total de trazabilidad de quién movió qué — indetectable el ajuste manual hecho para cubrir un faltante (robo interno).
**Corrección:** Ledger append-only e inmutable de `MovimientoInventario` con autor y timestamp obligatorios; `SaldoInventario` es un valor derivado, recalculado transaccionalmente al insertar cada movimiento (ADR-003 del SRS).
**Regla para el futuro:** Cualquier cantidad que represente un balance sujeto a escritura concurrente y a necesidad de auditoría (stock, saldo de cuenta, puntos de fidelidad) se modela como ledger de movimientos, no como columna mutable. Sin excepciones por "simplicidad" del MVP — la migración posterior es más cara que el modelo correcto desde el inicio.
**Tags:** #arquitectura #seguridad

## 2026-08-18 — Compartir framework de UI entre superficies con UX distinta es complejidad especulativa
**Contexto:** Definición de stack para web admin (escritorio) y app móvil (bodega/piso) del gestor de inventario.
**Error cometido (evitado a tiempo):** La primera instrucción del usuario pedía "escoger stack en consecuencia" de que el gestor es web y móvil, lo cual podía interpretarse como buscar un único framework universal para las dos superficies.
**Consecuencia si se hubiera forzado:** Frameworks "universales" cross-platform suelen degradar la UX de al menos una de las dos superficies (la densidad de tablas de escritorio y la interacción rápida táctil de bodega tienen necesidades opuestas), a cambio de un ahorro de código que no era el cuello de botella real.
**Corrección:** Next.js para las dos webs (catálogo + admin, que sí comparten naturaleza), React Native/Expo aparte para móvil (ADR-007). Lo que sí se comparte es lo que no depende de la pantalla: tipos de API y lógica de negocio (Idempotency-Key, validación de payload), vía paquete `@core/api-client` en el monorepo.
**Regla para el futuro:** Compartir código entre superficies solo donde el código no depende de la interfaz (contratos, validación, tipos). Nunca forzar un mismo framework de UI entre superficies con interacción y audiencia genuinamente distintas solo por parecer "más compartido" — eso es la complejidad especulativa que prohíbe el Principio de código #6.
**Tags:** #arquitectura

## 2026-08-18 — Headers HTTP son input no confiable, incluso en logging
**Contexto:** Definición de la política de seguridad no negociable del SRS (Sección 5).
**Error cometido (patrón a prevenir, no ocurrido en este proyecto aún):** Asumir que un header HTTP (`X-Forwarded-For`, `User-Agent`, `Referer`, etc.) es seguro de persistir directamente porque "solo se usa para logging o analytics", sin pasar por prepared statements.
**Consecuencia si ocurre:** Vector de SQLi que un audit centrado solo en parámetros de query no detecta — un `sqlmap` corrido sin `--level 3` sobre headers deja este vector sin cubrir, y un endpoint puede declararse "seguro" estando abierto igual.
**Corrección:** Toda escritura a base de datos derivada de un header usa prepared statements, sin excepción de "es solo logging". `X-Forwarded-For` se lee únicamente del proxy configurado. `Host` se valida contra allowlist.
**Regla para el futuro:** Ningún audit de SQLi se considera cerrado sin cobertura explícita del vector de headers HTTP. No declarar un endpoint resistente a SQLi solo por tener el query parametrizado si el pipeline de logging sigue siendo un sink de concatenación abierto.
**Tags:** #seguridad

## 2026-09-02 — Un DTO de registro público nunca debe exponer el campo `rol`
**Contexto:** Auditoría completa de seguridad y funcionalidad del monorepo. `RegisterDto` (`POST /api/auth/register`, sin autenticación) incluía un campo `rol` opcional validado con `@IsEnum` que aceptaba `ADMIN`, y `AuthService.register` lo copiaba directo a la base de datos. Los dos frontends además tenían un selector de rol en la pantalla de registro público, incluyendo la opción "Administrador".
**Error cometido:** Confundir "validar la forma del input" con "autorizar la acción". `@IsEnum(UserRoleDto)` valida que el valor sea uno de los roles legítimos del sistema, pero no valida si el *llamador* tiene permiso para asignar ese rol — y un endpoint sin `@UseGuards` no tiene ningún llamador con permisos verificados.
**Consecuencia:** Escalada de privilegios trivial: cualquiera en internet podía registrarse con `{"rol":"ADMIN"}` y obtener control total del sistema (gestión de usuarios, catálogo, precios, inventario, borrado de archivos). Es el hallazgo más grave de la auditoría (SEC-01).
**Corrección:** `RegisterDto` ya no declara el campo `rol`; el servicio asigna `Rol.CLIENTE` de forma incondicional. La asignación de roles de personal es exclusiva de `POST /api/usuarios`, protegido por `@Roles('ADMIN')`. Se retiró el selector de rol de ambas pantallas de registro público.
**Regla para el futuro:** Ningún DTO de un endpoint sin autenticación (o sin `@Roles`) debe aceptar un campo que determine permisos, rol, o cualquier atributo que el propio backend use después para tomar decisiones de autorización — sin importar cuán bien validado esté el tipo de dato. Si un campo así es necesario, pertenece a un DTO distinto detrás de un endpoint autenticado y verificado por rol.
**Tags:** #seguridad #rbac

## 2026-09-02 — `trustPolicy: no-downgrade` de pnpm compara contra todo el historial del paquete, no la misma línea mayor
**Contexto:** Al endurecer la cadena de suministro del monorepo (hallazgo SEC-17) se activó `trustPolicy: no-downgrade` en `pnpm-workspace.yaml`. La siguiente instalación limpia falló con `ERR_PNPM_TRUST_DOWNGRADE` para `chokidar@4.0.3`, `semver@6.3.1` y `undici-types@6.21.0`.
**Error que se pudo haber cometido:** Interpretar el bloqueo como una señal inequívoca de compromiso activo y, por pánico, desactivar `trustPolicy` por completo (perdiendo la protección real que da contra el patrón de ataque "cuenta de mantenedor comprometida") — o, en el otro extremo, forzar la instalación sin investigar.
**Investigación:** El hash de integridad de las 3 versiones en `pnpm-lock.yaml` coincide exactamente con el que expone hoy el registro de npm (`npm view <paquete> dist.integrity`) — no hay sustitución de contenido. Es un falso positivo documentado del propio pnpm (`pnpm/pnpm#10202`, reportado también en `tailwindlabs/tailwindcss#19423`): el chequeo compara el nivel de "provenance" contra *todas* las versiones publicadas de un paquete, no contra su misma línea mayor, así que una versión legítima y antigua (publicada antes de que existiera provenance) queda marcada solo porque una versión posterior no relacionada del mismo paquete sí la tiene.
**Corrección:** Se mantiene `trustPolicy: no-downgrade` activo (protege contra el patrón real de la campaña "Shai-Hulud"), y se agregó `trustPolicyExclude` listando exactamente las 3 versiones verificadas, con un comentario que registra cómo se verificaron y la fecha.
**Regla para el futuro:** Un `ERR_PNPM_TRUST_DOWNGRADE` no es evidencia de compromiso por sí solo — verificar primero el hash de integridad contra el registro en vivo antes de decidir. Nunca desactivar una política de seguridad recién agregada para "que pase la instalación" sin verificar; y nunca forzar la instalación (`--no-verify` o equivalente) sin que el hallazgo se investigue y quede documentado, dado que sí existe una campaña activa de compromiso de paquetes npm en este período.
**Tags:** #seguridad #cadena-de-suministro

## 2026-09-02 — Cerrar un campo de escalada de privilegios puede quitar también el único camino de arranque legítimo
**Contexto:** Al corregir SEC-01 (el registro público aceptaba `rol: "ADMIN"` del llamador), se eliminó por completo el campo `rol` de `RegisterDto` y se forzó `CLIENTE` sin condiciones. Al probar contra una base de datos real recién migrada (0 usuarios), no había ninguna forma de crear el primer administrador: `POST /api/usuarios` ya exige rol ADMIN, y el registro público ahora siempre da CLIENTE.
**Error cometido (detectado antes de entregarlo, no en producción):** Tratar "el cliente puede elegir su rol" y "el sistema necesita un primer administrador" como el mismo problema. Eliminar el campo por completo resolvía el primero pero rompía el segundo — un caso de sobre-corrección que solo se hizo visible al probar de extremo a extremo contra infraestructura real, nunca apareció en la verificación estática (`tsc`, build) ni habría aparecido en un test unitario que no ejercitara el escenario de base de datos vacía.
**Corrección:** Se restauró el patrón "el primer usuario es ADMIN", pero calculado enteramente por el servidor (`usuario.count() === 0`), nunca a partir de un campo que el cliente envía. Es la misma idea que tenía el código original, pero la vulnerabilidad nunca estuvo en "el primer usuario es admin" — estuvo en que el *campo* `rol` era controlable por cualquier llamador para *cualquier* registro, no solo el primero.
**Regla para el futuro:** Al cerrar una escalada de privilegios basada en un campo controlado por el cliente, verificar si ese campo también resolvía un caso de arranque legítimo (creación del primer admin, primer tenant, primera configuración) antes de eliminarlo sin más. La corrección correcta casi siempre es mover la decisión a una condición que el servidor computa (estado de la base de datos), no eliminar la funcionalidad completa ni dejar el campo abierto al cliente.
**Tags:** #seguridad #rbac

## 2026-09-02 — Verificar solo con mocks no basta: la latencia de red real puede tumbar una transacción que "funciona" en local
**Contexto:** Al conectar por primera vez contra un Postgres real (Supabase, con la app corriendo en una red distinta al proveedor), crear un producto con una sola variante disparó `P2028: Transaction already closed` — el timeout por defecto de las transacciones interactivas de Prisma (5000 ms) se agotó a los 5166 ms.
**Error que se pudo haber cometido:** Confiar en que "pasa `tsc`, pasan los tests unitarios con Prisma mockeado, compila" era suficiente evidencia de corrección. Los mocks no tienen latencia de red; ningún test unitario iba a exponer este problema nunca, sin importar cuántos se escribieran.
**Corrección:** `{ timeout: 20000 }` explícito en los tres `$transaction` del backend que hacen varias escrituras secuenciales (creación/actualización de producto, registro de movimiento de inventario).
**Regla para el futuro:** Una transacción con múltiples escrituras secuenciales necesita un timeout explícito y generoso, nunca el default, en cualquier código que pueda correr contra una base de datos remota (que es el caso típico de Postgres gestionado — Supabase, Neon, RDS). Y de forma más general: los tests unitarios con mocks verifican la lógica, no el comportamiento bajo latencia real — antes de dar por cerrado un fix sobre código que toca la base de datos, si es posible, probarlo contra una base de datos real aunque sea una vez.
**Tags:** #arquitectura #rendimiento
