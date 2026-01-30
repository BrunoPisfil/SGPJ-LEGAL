-- Migration: Add carpeta_fiscal column to procesos table
-- Description: Add carpeta_fiscal field for penal processes

ALTER TABLE procesos ADD COLUMN carpeta_fiscal VARCHAR(120) NULL COMMENT 'Número de carpeta fiscal para procesos penales';

-- Create index if needed
CREATE INDEX idx_procesos_carpeta_fiscal ON procesos(carpeta_fiscal);
