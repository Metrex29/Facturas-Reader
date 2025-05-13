-- Script para añadir columnas para almacenar PDFs como BLOB

-- Añadir columna file_blob para almacenar el PDF como BYTEA (tipo binario en PostgreSQL)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS file_blob BYTEA;

-- Añadir columna file_name para almacenar el nombre original del archivo
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);

-- Comentarios para las nuevas columnas
COMMENT ON COLUMN invoices.file_blob IS 'Contenido del archivo PDF almacenado como BLOB';
COMMENT ON COLUMN invoices.file_name IS 'Nombre original del archivo PDF';

-- Nota: La columna file_url existente se mantendrá para compatibilidad con versiones anteriores
-- pero puede ser NULL cuando se use file_blob

-- Instrucciones de uso:
-- Ejecutar este script en la base de datos PostgreSQL con el comando:
-- psql -U <usuario> -d facturasIA -f add_blob_columns.sql