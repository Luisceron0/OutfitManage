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
