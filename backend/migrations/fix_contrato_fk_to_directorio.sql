-- =========================================================
-- Migración: Cambiar FK de contratos.cliente_id
-- De: clientes(id) 
-- A: directorio(id)
-- =========================================================

-- Primero, eliminar la FK existente
ALTER TABLE contratos DROP FOREIGN KEY fk_contrato_cliente;

-- Luego, agregar la nueva FK apuntando a directorio
ALTER TABLE contratos ADD CONSTRAINT fk_contrato_cliente FOREIGN KEY (cliente_id) REFERENCES directorio(id);

-- Verificar que la migración fue exitosa
SHOW CREATE TABLE contratos;
