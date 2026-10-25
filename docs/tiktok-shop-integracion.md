# Judi's Shop → TikTok Shop México

## Estado
**Preparación técnica; no conectada ni autorizada.** Esta rama no publica productos, no escribe en inventario y no envía información a TikTok.

## Catálogo de origen
- Repositorio: `jbsuite78/judis-shop` (Next.js, Prisma, PostgreSQL).
- Fuente de verdad: registros `Producto` de la base de datos de Judi's Shop.
- Vista previa protegida: `GET /api/integraciones/tiktok/vista-previa`.
- Acceso: sesión administrativa existente de Judi's Shop, nunca pública.
- SKU estable propuesto: `JUDIS-<id>`; no se envían costos ni utilidades.
- Imágenes: sólo URLs HTTPS. Se requieren fotografías auténticas del producto, no pósters con textos comerciales.

## Requisitos antes de una sincronización real
1. Terminar almacén, remitente y devoluciones en TikTok Seller Center México con dirección real.
2. Crear una aplicación privada **Custom app** en TikTok Shop Partner Center para un único vendedor (México, vendedor local), habilitando sólo los permisos necesarios para productos, inventario y pedidos. El tipo/categoría de app debe elegirse con cuidado y según opciones disponibles de Partner Center.
3. Registrar un callback HTTPS de vendedor y completar autorización OAuth; conservar `app_key`, `app_secret`, tokens y claves de webhook exclusivamente en secretos del servidor. Nunca introducirlos en código, repositorio, capturas ni mensajes.
4. Confirmar permisos/categorías. Belleza, fragancias y cosméticos pueden exigir documentación y autorización específica para México; no publicar automáticamente estos productos.
5. Validar por SKU pesos, medidas de paquete, categoría TikTok, variaciones, stock físico, fotografías, restricciones de marca y documentación. No suponer que las categorías de Judi's Shop coinciden con las de TikTok.
6. Implementar (en otra fase) cliente de API firmado, renovación de tokens, mapeo persistente del ID de producto/SKU de TikTok con el ID de Judi's Shop, registro de errores, reintentos idempotentes, webhooks verificados, confirmaciones de pedido y sincronización de existencias en ambos sentidos con reserva atómica para evitar sobreventas.
7. Activar en modo **revisión / sin publicar** y probar con uno o dos productos no restringidos antes de activar sincronización de productos y pedidos.
8. Confirmar la política de envíos y el estado de la cuenta antes de publicar productos.

## Documentación oficial
- Crear aplicación: https://partner.tiktokshop.com/docv2/page/create-your-app
- Revisión de aplicación: https://partner.tiktokshop.com/docv2/page/app-review-process
- Firma/API: https://partner.tiktokshop.com/docv2/page/common-parameters
- Inventario: https://partner.tiktokshop.com/docv2/page/update-inventory
- Productos restringidos (México): https://seller-mx.tiktok.com/university/essay?knowledge_id=8357469202958081

## Limitaciones de esta primera fase
La vista previa permite identificar información del catálogo aprovechable y lo que falta. **No es un integrador en producción**: un endpoint de catálogo no basta por sí solo para sincronizar con TikTok Shop. Tampoco reemplaza la autorización OAuth ni los requisitos de producto y logística.
