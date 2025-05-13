or# Instrucciones para completar la implementación

## Resumen de cambios realizados

Hemos implementado un sistema para que cada usuario pueda subir sus facturas como BLOB (Binary Large Object) a la base de datos PostgreSQL. Los archivos PDF se convierten a formato binario y se almacenan directamente en la base de datos, asociados al usuario que los subió.

## Pasos pendientes para completar la implementación

### 1. Instalar dependencias necesarias

En el directorio del servidor, ejecuta el siguiente comando para instalar body-parser:

```bash
cd server
npm install body-parser --save
```

### 2. Ejecutar el script de migración para añadir las columnas necesarias

Ejecuta el siguiente comando para añadir las columnas `file_blob` y `file_name` a la tabla `invoices`:

```bash
psql -U <tu_usuario> -d facturasIA -f server/migrations/add_blob_columns.sql
```

Reemplaza `<tu_usuario>` con tu nombre de usuario de PostgreSQL.

### 3. Reiniciar el servidor

Reinicia el servidor para aplicar los cambios:

```bash
cd server
npm run dev
```

## Funcionalidades implementadas

1. **Subida de facturas como BLOB**: Los usuarios pueden subir archivos PDF que se convierten a formato binario y se almacenan en la base de datos.

2. **Visualización de facturas**: Los usuarios pueden ver sus facturas almacenadas y abrir los PDFs directamente en el navegador.

3. **Asociación de facturas con usuarios**: Cada factura está asociada con el usuario que la subió mediante la columna `user_id`.

## Endpoints de la API

- `POST /api/invoices/upload-blob`: Para subir una factura como BLOB
- `GET /api/invoices/:userId`: Para obtener todas las facturas de un usuario
- `GET /api/invoices/blob/:id`: Para obtener y visualizar el PDF de una factura específica
- `PUT /api/invoices/:id`: Para actualizar la información de una factura
- `DELETE /api/invoices/:id`: Para eliminar una factura

## Estructura de datos

La tabla `invoices` ahora tiene las siguientes columnas adicionales:

- `file_blob`: Almacena el contenido del archivo PDF como BYTEA (tipo binario en PostgreSQL)
- `file_name`: Almacena el nombre original del archivo PDF

La columna `file_url` existente se mantiene para compatibilidad con versiones anteriores, pero puede ser NULL cuando se use `file_blob`.

## Notas adicionales

- Los archivos PDF se convierten a Base64 en el cliente antes de enviarse al servidor
- El servidor convierte el Base64 a Buffer para almacenarlo como BYTEA en PostgreSQL
- El límite de tamaño para los archivos se ha establecido en 50MB