# Hogar — Prototipo funcional v1

Aplicación web responsive para registrar finanzas personales y familiares. Idioma español, moneda USD.

## Uso rápido

1. Servir la carpeta en un servidor HTTP (por ejemplo `python -m http.server 8080`).
2. Abrir `http://localhost:8080` en el navegador. Para probar en un teléfono, utilizar HTTPS de un hosting o servidor seguro; `localhost` admite service workers.
3. Ir a **Ajustes > Cargar datos de ejemplo** para explorar el dashboard con movimientos ficticios; o registrar gastos reales directamente.
4. Instalar como PWA desde el menú del navegador si este ofrece la opción de instalación.

## Funcionalidades incluidas
- Gastos e ingresos rápidos con fecha, categoría, descripción, familiar, cuenta y forma de pago.
- Dashboard con totales mensuales, saldos, límites, categorías y últimos siete días.
- Cuentas de efectivo, banco y tarjetas de crédito con saldo calculado.
- Presupuesto mensual por categoría, indicadores 80% y 100%.
- Recordatorios de movimientos recurrentes con confirmación manual.
- Miembros familiares como etiquetas de movimientos.
- Exportación CSV y respaldo/importación JSON.
- Persistencia local con `localStorage`; cache de archivos de la app con service worker para uso sin conexión tras primera instalación/carga.

## Limitaciones deliberadas
- **La sincronización nube/dispositivos no está implementada**. La arquitectura híbrida se contempla para la siguiente fase.
- **No hay autenticación**: los nombres de familiares no son cuentas de usuario independientes.
- El `localStorage` es local a cada navegador y podría eliminarse al limpiar datos. Realizar copias de seguridad JSON.
- El cache offline requiere HTTPS o localhost; abrir `index.html` como `file://` no activa service worker.
- El MVP no gestiona transferencias entre cuentas ni pagos de tarjeta (necesitan asientos dobles para evitar sumar falsos gastos).
- El CSV es exportación, no sincronización externa.

## Arquitectura recomendada para versión multiusuario con sincronización
- Frontend: PWA responsive en React + TypeScript, con Vite.
- Almacenamiento local: IndexedDB (Dexie) con cola de operaciones `outbox`; service worker para recursos estáticos.
- Backend: PostgreSQL + API HTTPS con autenticación, membresías familiares y autorización por `household_id` (p. ej. Supabase con RLS o API Node/Fastify).
- Modelo de datos: `households`, `users`, `memberships`, `accounts`, `categories`, `transactions`, `budgets`, `recurring_rules`, `sync_operations`.
- Sincronización: IDs UUID, `updated_at`, `deleted_at` (tombstones), `version`, deduplicación por `operation_id`, conflictos explícitos por entidad, reintentos y operaciones idempotentes.
- Seguridad: jamás incluir llaves de servicio en el frontend; políticas RLS por hogar, HTTPS, respaldo automatizado en servidor, y registro de auditoría.
- Cuentas y transferencias: modelo de libros contables/ledger para movimientos de dinero y pagos a tarjetas sin duplicación de egresos.

## Estructura
- `index.html`: prototipo completo, sin dependencias de CDN.
- `manifest.webmanifest`: configuración de instalación.
- `icon.svg`: icono de la app.
- `sw.js`: cache de recursos estáticos offline.
# Ortiz
