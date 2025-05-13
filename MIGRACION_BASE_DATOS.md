# Migración de Base de Datos para el Sistema de Carga de Archivos

## Descripción General

Este documento describe los cambios necesarios en la base de datos para adaptar el sistema a la nueva implementación de carga de archivos que utiliza `FormData` en lugar de codificación base64.

## Cambios en la Estructura de la Base de Datos

Hemos creado una migración SQL que realiza los siguientes cambios en la tabla `invoices`:

1. **Modificación del campo `file_blob`**: Se ha configurado como opcional (puede ser NULL) para permitir el almacenamiento de archivos en disco en lugar de en la base de datos.

2. **Configuración del campo `file_url`**: Se ha establecido como NOT NULL y se ha definido su tipo como VARCHAR(255) para almacenar las rutas relativas a los archivos en el sistema de archivos.

3. **Creación de índice**: Se ha añadido un índice para el campo `file_url` para mejorar el rendimiento en las búsquedas.

4. **Actualización de registros existentes**: Se actualizan los registros que tengan `file_url` NULL con un valor por defecto.

## Archivos Creados

1. **Migración SQL**: `server/migrations/update_file_storage.sql`
   - Contiene las instrucciones SQL para modificar la estructura de la tabla.

2. **Script de configuración de carpeta**: `server/scripts/setup_uploads_folder.js`
   - Verifica que la carpeta `uploads` exista y tenga los permisos adecuados.

3. **Script de ejecución de migración**: `server/scripts/run_migration.js`
   - Facilita la ejecución de la migración SQL utilizando las credenciales de la base de datos.

## Pasos para Implementar los Cambios

### 1. Ejecutar la Migración de Base de Datos

```bash
node server/scripts/run_migration.js
```

Este script ejecutará la migración SQL que adapta la estructura de la tabla `invoices` al nuevo sistema de carga de archivos.

### 2. Configurar la Carpeta de Uploads

```bash
node server/scripts/setup_uploads_folder.js
```

Este script verifica que la carpeta `uploads` exista y tenga los permisos adecuados para el almacenamiento de archivos.

### 3. Reiniciar el Servidor

Una vez completados los pasos anteriores, reinicie el servidor para aplicar los cambios:

```bash
cd server
npm start
```

## Verificación

Para verificar que los cambios se han aplicado correctamente:

1. Intente subir un archivo utilizando el nuevo sistema de carga de archivos.
2. Verifique que el archivo se guarde correctamente en la carpeta `uploads`.
3. Compruebe que la URL del archivo se almacene correctamente en la base de datos.
4. Acceda al archivo a través de la URL almacenada.

## Consideraciones Adicionales

- La carpeta `uploads` debe tener permisos adecuados para escritura.
- Los archivos se almacenarán en disco en lugar de en la base de datos, lo que mejora el rendimiento.
- Las URLs de los archivos tendrán el formato `/uploads/nombre_archivo.ext`.
- El servidor está configurado para servir archivos estáticos desde la carpeta `uploads`.

## Rollback

En caso de necesitar revertir los cambios, se recomienda crear una migración de rollback que restaure la estructura original de la tabla.