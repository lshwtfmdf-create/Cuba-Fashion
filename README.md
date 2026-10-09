# Cuban Fashioner

Tienda de demostración para catálogo de baterías de laptop, carrito y recogida local en Cuba. Está implementada con HTML, CSS y JavaScript nativo, sin dependencias ni servidor.

## Cómo ejecutar

Abre `index.html` en un navegador moderno. Si el navegador bloquea módulos JavaScript al abrir archivos locales, inicia un servidor estático desde la carpeta del proyecto, por ejemplo:

```sh
python -m http.server 8000
```

Después abre `http://localhost:8000`.

## Funciones incluidas

- Catálogo adaptable con búsqueda por modelo, marca o especificaciones y filtro de disponibilidad.
- Detalle de producto en modal y carrito con cantidades, subtotales y total.
- Registro/inicio de sesión de demostración para clientes por nombre y correo/teléfono.
- Confirmación de pedido con resumen JSON, opción de copiarlo o abrir WhatsApp con el mensaje preparado para `+53 50727220`, e historial local visible para el administrador.
- Panel con alta, edición, eliminación y actualización de disponibilidad del inventario.
- Persistencia local del catálogo, sesión de demostración, carrito y pedidos con `localStorage`.

## Acceso de demostración

- **Administrador:** `admin@cuban-fashioner.com`
- **Contraseña:** `Cuba2026!`

La autenticación no es segura para producción: las credenciales y los datos se procesan en el navegador. `localStorage` es local al dispositivo y no sincroniza con otros usuarios. Para un lanzamiento real, sustituye esta simulación por un backend con autenticación, base de datos, autorización y procesamiento de pedidos seguros.
