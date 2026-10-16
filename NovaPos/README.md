# NovaPOS — Frontend de demostración

Frontend académico para el Sistema de Punto de Venta descrito en la Fase 1.

## Archivos
- `index.html`: estructura principal y navegación.
- `css/styles.css`: diseño adaptable a escritorio, tablet y móvil.
- `js/app.js`: navegación SPA, formularios, datos demo y acciones interactivas.

## Ejecutarlo
1. Descomprime la carpeta.
2. Abre `index.html` en el navegador. Recomendado: usar la extensión **Live Server** de Visual Studio Code.
3. Navega por los módulos desde el menú lateral.
4. Prueba crear productos/clientes, registrar compras, abrir caja y hacer una venta desde Punto de venta.

## Qué funciona en modo demostración
- Navegación entre vistas sin recarga.
- Formularios de productos, categorías, clientes y proveedores.
- Búsqueda de productos/clientes.
- Carrito, cantidades, cálculo de total y cobro.
- Validaciones básicas y control de stock local.
- Apertura/cierre de caja local.
- Historial de ventas, vista imprimible de documento ilustrativo y exportación CSV.
- Diseño adaptable.

## Conexión con el backend del compañero
El documento de Fase 1 define una API versionada bajo `/api/v1`. Los endpoints esperados incluyen:
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/productos`, `POST /api/v1/productos`
- `PUT /api/v1/productos/:id`, `DELETE /api/v1/productos/:id`
- `GET /api/v1/clientes`, `POST /api/v1/clientes`
- `GET /api/v1/proveedores`
- `POST /api/v1/compras`
- `GET /api/v1/ventas`, `POST /api/v1/ventas`
- `GET /api/v1/caja`, `POST /api/v1/caja/apertura`, `POST /api/v1/caja/cierre`
- `POST /api/v1/facturas`
- `GET /api/v1/documentos/:id`

En `js/app.js`:
1. Cambiar `API_BASE_URL` por la dirección de la API, por ejemplo `http://localhost:3000`.
2. Cambiar `USE_DEMO_DATA` a `false` cuando se implemente la integración.
3. Reemplazar las operaciones locales de demostración por llamadas a `apiRequest(...)`.
4. Acordar con el compañero el formato exacto de JSON, los nombres de campos y cómo se manejará la autenticación.

`apiRequest()` ya está preparado como helper básico para solicitudes JSON. Por ahora la interfaz funciona con datos locales; cambiar la URL por sí solo NO conecta automáticamente todos los módulos a la base de datos.

## Importante
- Este frontend no implementa autenticación real, autorización, RLS ni persistencia en PostgreSQL.
- No incluir claves privadas/service-role de Supabase en JavaScript del navegador.
- El backend debe validar permisos, entradas, existencias y precios, y registrar ventas/compras de forma transaccional.
- La factura imprimible es un documento ilustrativo sin validez fiscal.
