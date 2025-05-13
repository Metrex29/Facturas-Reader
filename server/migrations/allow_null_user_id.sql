-- Migración para permitir valores NULL en el campo user_id de la tabla invoices
ALTER TABLE invoices ALTER COLUMN user_id DROP NOT NULL;

-- Crear un índice para las facturas anónimas
CREATE INDEX idx_invoices_anonymous ON invoices WHERE user_id IS NULL;