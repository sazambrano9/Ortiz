# Hogar — Finanzas familiares V2 (prototipo local)

Aplicación PWA de finanzas familiares en USD, sin dependencias externas, apta para GitHub Pages y Vercel.

## Novedades

- Editar cuentas (nombre, saldo inicial y tipo si no existen operaciones).
- Editar pagos recurrentes y familiares.
- Crear, editar y eliminar categorías (solo se eliminan si no están en uso).
- Transferir dinero entre cuentas sin duplicar ingresos o gastos, con pagos de efectivo/banco a tarjeta de crédito. Transferencias reversibles mediante eliminación.
- Pantalla de acceso local con administrador `szambrano`; **en el primer inicio debes establecer tú la contraseña**. No se guarda en el código.
- Usuarios locales familiares opcionales; el administrador puede restablecer sus contraseñas desde la sección Familia.

## Instalación

Sirve la carpeta con `python -m http.server 8080` y abre http://localhost:8080 o sube los archivos de la carpeta a GitHub y despliega el proyecto en Vercel con framework `Other`. No requiere build.

## Advertencia de seguridad importante

**La autenticación es solo de demostración y NO es una barrera de seguridad real:** todo se guarda localmente en el navegador, y un usuario con acceso al mismo navegador puede consultar o modificar los datos usando las herramientas del navegador. Las contraseñas locales se derivan con PBKDF2 y sal aleatoria; no se guardan en texto plano, pero el mecanismo no sustituye autenticación de servidor. El administrador se configura en el primer acceso desde cada navegador y no sincroniza entre equipos. Nunca uses una contraseña real que reutilices en otros servicios para esta demostración.

Para una aplicación familiar real, implementar backend con autenticación centralizada y verificación de roles, base de datos PostgreSQL, sincronización IndexedDB y permisos por hogar. No publicar gastos sensibles en un dispositivo compartido bajo esta versión.

## Almacenamiento

Los movimientos, categorías, cuentas, usuarios locales y contraseñas derivadas se guardan en `localStorage`. La sesión permanece durante la pestaña usando `sessionStorage`. Descarga respaldos JSON con frecuencia y conserva una copia segura. La importación/exportación JSON no sincroniza las credenciales del administrador.

## Esquema lógico de transferencias

Cada transferencia tiene `fromId`, `toId`, `amount`, `date`, `note`. Los saldos de cuentas normales disminuyen en origen y aumentan en destino. En una cuenta de crédito, un pago reduce la deuda. Las transferencias no incrementan los totales de gastos ni de ingresos del mes.
