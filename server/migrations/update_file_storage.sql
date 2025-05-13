-- Migración para adaptar la tabla 'invoices' al nuevo sistema de carga de archivos

-- Hacer que file_blob sea opcional (puede ser NULL)
ALTER TABLE invoices ALTER COLUMN file_blob DROP NOT NULL;

-- Asegurar que file_url esté configurado correctamente
ALTER TABLE invoices ALTER COLUMN file_url TYPE VARCHAR(255);
ALTER TABLE invoices ALTER COLUMN file_url SET NOT NULL;

-- Añadir comentarios para documentar los cambios
COMMENT ON COLUMN invoices.file_blob IS 'Contenido del archivo PDF almacenado como BLOB (opcional, puede ser NULL cuando se usa file_url)';
COMMENT ON COLUMN invoices.file_url IS 'Ruta relativa al archivo en el sistema de archivos (formato: /uploads/filename.ext)';

-- Crear índice para mejorar las búsquedas por file_url
CREATE INDEX IF NOT EXISTS idx_invoices_file_url ON invoices(file_url);

-- Verificar si hay registros con file_url NULL y actualizar con un valor por defecto
UPDATE invoices SET file_url = '/uploads/archivo_no_disponible.pdf' WHERE file_url IS NULL;

-- Crear directorio uploads si no existe
-- Nota: Esta operación debe realizarse manualmente en el sistema de archivos
-- Comando recomendado: mkdir -p server/uploads && chmod 755 server/uploads