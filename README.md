# Hogar Finanzas V3 — PostgreSQL y acceso familiar

Esta versión integra la interfaz existente con **Vercel Functions (Node.js)** y **Neon PostgreSQL**, usuarios con contraseña **scrypt** del servidor, sesión protegida con cookie HttpOnly/Secure/SameSite=Strict, usuarios familiares, restablecimiento de contraseñas por administrador, sincronización y almacenamiento local para trabajo sin conexión después de autenticarse.

> **Estado:** código preparado y sintaxis verificada. No desplegado ni conectado todavía a una base real; requiere tu configuración personal de Vercel/Neon. Sin base de datos, el acceso no funcionará. No copiar contraseñas en archivos versionados.

## 0. Respaldo antes del cambio

Desde **el mismo navegador y dominio** donde usabas V2.1, abre **Ajustes → Descargar respaldo JSON**. Guarda el archivo seguro. No borres los datos del navegador. El despliegue de una versión estática nueva en el mismo dominio no borra normalmente `localStorage`, pero un cambio de dominio sí puede hacer que no se encuentren.

## 1. Crea PostgreSQL en Neon

1. En https://console.neon.tech crea un proyecto (ejemplo: `hogar-finanzas`).
2. Copia el **pooled connection string** en formato `postgresql://...` con hostname `-pooler`.
3. Abre el **SQL Editor** en Neon y ejecuta **todo el archivo `sql/schema.sql`**. Esta operación crea las tablas `households`, `users`, `sessions` y `login_attempts`. No borra tablas existentes.

## 2. Variables de entorno en Vercel

En **Project → Settings → Environment Variables**, define en *Production* (y Preview si usarás vista previa):

- `DATABASE_URL`: cadena de conexión PostgreSQL obtenida de Neon; **no agregar comillas**.
- `ADMIN_SETUP_TOKEN`: token secreto aleatorio de **mínimo 24 caracteres**, solo para crear la cuenta administradora en el primer despliegue. Genera por ejemplo con: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

**No uses la contraseña de login como `ADMIN_SETUP_TOKEN`.** Nunca subas valores de `.env` a GitHub. Después de instalar el administrador, puedes retirar `ADMIN_SETUP_TOKEN` del entorno de producción.

En Vercel selecciona **Framework Preset: Other** y raíz del repositorio `./`. Deja Build Command sin personalizar; Vercel detecta las funciones en `/api` y usa `package.json` para instalar `pg`.

## 3. Despliegue

Reemplaza los archivos de `D:\Personal\gastos_familiares` por el contenido de este ZIP y ejecuta desde Git Bash:

```sh
git add .
git commit -m "Hogar V3 PostgreSQL login real y sync"
git push origin main
```

Si `main` está conectada a Vercel, el despliegue se ejecuta automáticamente. Abre tu URL habitual por **HTTPS**.

## 4. Primera instalación y migración

1. Abre la página en un navegador con Internet. Si la base de datos está vacía, verás **Configurar administrador**.
2. Usuario fijo: `szambrano`. Establece una **contraseña nueva y única de al menos 12 caracteres**, y escribe en el tercer campo el código `ADMIN_SETUP_TOKEN` de Vercel. No se recomienda reutilizar la contraseña que compartiste anteriormente por chat.
3. Ingresa a Ajustes. Si hay movimientos de la V2.1 almacenados en **ese mismo navegador/origen**, aparecerá la indicación de migración. Presiona **Migrar datos anteriores**, previa exportación de respaldo JSON.
4. Si los datos antiguos ya no están en ese origen, usa **Ajustes → Importar JSON** con tu respaldo. Esto sustituye el conjunto de datos completo; úsalo solo sobre un hogar recién inicializado o cuando hayas hecho un respaldo adecuado.
5. En **Familia**, crea o edita un familiar con usuario (ejemplo: `maria`). Después presiona **Crear acceso / Restablecer clave**, escribe una contraseña de al menos 12 caracteres y comparte la clave de forma segura. El familiar podrá entrar desde otro dispositivo.

## 5. Cómo funciona la sincronización

- Un gasto se guarda **inmediatamente en almacenamiento local** y se envía al servidor cuando hay conexión; se indica en **Ajustes → Estado de sincronización**.
- Los otros dispositivos activos refrescan información cada ~30 s; también se puede pulsar **Sincronizar ahora**.
- Una actualización incluye un número de **revisión**. Si otra persona guardó primero, el servidor devuelve **409 CONFLICT**. La aplicación no pisa los datos remotos y pide exportar respaldo local antes de recuperar la información del servidor.
- El modo offline funciona solo tras un **inicio de sesión válido** en ese navegador y después de haber cargado la app. Si cierras sesión sin Internet no podrás volver a iniciar hasta recuperar conexión.
- La sincronización **NO fusiona cambios simultáneos automáticamente**: deben resolverse manualmente. Evitar la sobreescritura silenciosa es más seguro que fusionar balances a ciegas.
- El almacenamiento offline sigue dependiendo de los datos del sitio; utiliza respaldos JSON periódicos.

## 6. Seguridad y límites conocidos

- El usuario principal es `szambrano`. **No se incorpora ninguna contraseña al repositorio**; el administrador establece la suya con código privado.
- Las contraseñas se almacenan como hash `scrypt` con sal aleatoria en PostgreSQL. Las sesiones se guardan en cookies HttpOnly y tokens hash en BD; el rol de administrador se verifica en el servidor al crear/restablecer cuentas familiares.
- El restablecimiento familiar revoca las sesiones de ese familiar. Un familiar tiene acceso al contenido **compartido** del hogar. No se soportan todavía permisos granulares por cuenta o categoría.
- Las contraseñas **no se incluyen** en los JSON de movimientos sincronizados desde V3. Los respaldos V2 pueden contener hashes de contraseñas locales: cuídalos y **no los compartas**.
- Las funciones API requieren conectividad, PostgreSQL y esquema aplicado; Vercel no es por sí sola una base de datos.
- Para un despliegue grande, habilitar auditoría, 2FA, recuperación de cuenta administrador, políticas por rol más estrictas, cambios incrementales idempotentes e historial de revisiones. No se ofrece una solución completa de contabilidad concurrente empresarial.

## Verificación rápida

- Acceso al dominio HTTPS, pantalla Configurar administrador aparece solo si no hay usuarios.
- `GET /api/auth?action=status` responde `{ "setupRequired": true }` en base inicial vacía.
- Una vez identificado, registra un gasto y comprueba **Sincronizado con PostgreSQL**.
- Desde incógnito u otro teléfono, inicia con familiar ya creado y verifica que el movimiento aparezca.
- Prueba transferencia entre cuentas: disminuye origen y aumenta destino, sin contabilizarse en gastos/ingresos.
- En caso de error de servidor revisa **Vercel → Logs** y el resultado de ejecutar `sql/schema.sql`.


## Corrección V3.1
Se agregó el campo de código de instalación `setupTokenWrap` y `setupToken` al formulario inicial para evitar el error `Cannot read properties of null (reading style)`. El código debe coincidir con la variable ADMIN_SETUP_TOKEN de Vercel. Se actualizó la caché PWA.
