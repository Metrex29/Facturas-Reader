-- Migración para añadir la columna validation_info a la tabla invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS validation_info JSONB;

-- Añadir comentario para documentar la columna
COMMENT ON COLUMN invoices.validation_info IS 'Información de validación de la factura en formato JSON'; 