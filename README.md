# Cuban Fashioner

Tienda de baterías para laptop implementada con HTML, CSS y JavaScript nativo. GitHub Pages publica los archivos estáticos; Supabase proporciona autenticación y almacenamiento compartido.

## Ejecutar localmente

Abre `index.html` en un navegador moderno o inicia un servidor estático desde la carpeta del proyecto:

```sh
python -m http.server 8000
```

Después abre `http://localhost:8000`. Sin configurar Supabase se muestra un catálogo de demostración de solo lectura; el inicio de sesión, los pedidos y la administración quedan deshabilitados.

## Configurar Supabase

1. Crea un proyecto en Supabase.
2. En **SQL Editor**, ejecuta el contenido de [`supabase/schema.sql`](./supabase/schema.sql). Crea las tablas con Row Level Security, el bucket público `products` y sus políticas de acceso, además de los productos iniciales.
3. En **Project Settings → API**, copia la URL del proyecto y la clave pública `anon`/`publishable` en `js/supabase-config.js`.
4. **No copies la clave `service_role` al sitio, al repositorio ni al navegador.** La URL y la clave pública están diseñadas para estar en el cliente; las políticas RLS son las que limitan los datos.
5. En Supabase Auth, habilita el proveedor de correo y la confirmación de correo. En la configuración de URL, añade el dominio de GitHub Pages del sitio a las URL de redirección permitidas.
6. Registra la cuenta administradora con el correo configurado en `supabase/schema.sql` y confirma el correo. La tienda identifica qué usuario autenticado debe ver el panel comparando su correo; las políticas RLS y la función `is_admin()` de Supabase siguen siendo la autorización efectiva para administrar productos y leer pedidos. Las demás cuentas solo pueden iniciar sesión y hacer sus propios pedidos.
7. Publica el proyecto en GitHub Pages. Al actualizar los datos de `js/supabase-config.js`, publica de nuevo el sitio.

Las contraseñas se envían al servicio Supabase Auth por HTTPS y no se incluyen en el código ni se guardan en `localStorage`. Los clientes pueden registrarse con correo; el carrito y la preferencia de tema permanecen locales al dispositivo. Catálogo y pedidos se comparten mediante Supabase.

## Funciones

- Catálogo adaptable con búsqueda, filtro de disponibilidad y detalle de productos.
- Carrito, cantidades, totales y confirmación de pedido por WhatsApp.
- Registro e inicio de sesión de clientes mediante Supabase Auth.
- Panel de administración para gestionar productos y consultar pedidos.
- Permisos de base de datos: catálogo de lectura pública, cambios de productos y lectura de pedidos reservados a la cuenta administradora.
- Modo oscuro/claro y carrito guardados localmente.

La tienda necesita Supabase configurado y las políticas SQL aplicadas antes de habilitar autenticación o administración en producción.
