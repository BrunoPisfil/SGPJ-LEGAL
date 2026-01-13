-- =========================================================
-- Script para INSERTAR TODOS LOS JUZGADOS
-- 34 Distritos × Instancias × Especialidades correspondientes
-- =========================================================

USE defaultdb;

-- Limpiar juzgados existentes en directorio (opcional, cuidado!)
-- DELETE FROM directorio WHERE tipo = 'juzgado' AND distrito_judicial_id IS NOT NULL;

-- =========================================================
-- INSERTAR JUZGADOS POR INSTANCIA
-- =========================================================

-- 1. JUZGADO DE PAZ LETRADO (instancia_id=1) con 8 especialidades
INSERT INTO directorio (tipo, nombre, distrito_judicial, distrito_judicial_id, instancia_id, especialidad_id, activo)
SELECT 
  'juzgado',
  CONCAT('Juzgado de Paz Letrado - ', dj.nombre, ' - ', e.nombre),
  dj.nombre,
  dj.id,
  1,
  e.id,
  1
FROM distritos_judiciales dj
CROSS JOIN especialidades e
WHERE e.nombre IN ('CIVIL', 'COMERCIAL', 'CONTENCIOSO ADM.', 'DERECHO CONSTITUC', 'FAMILIA CIVIL', 'FAMILIA PENAL', 'FAMILIA TUTELAR', 'LABORAL')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- 2. JUZGADO ESPECIALIZADO (instancia_id=2) con 8 especialidades
INSERT INTO directorio (tipo, nombre, distrito_judicial, distrito_judicial_id, instancia_id, especialidad_id, activo)
SELECT 
  'juzgado',
  CONCAT('Juzgado Especializado - ', dj.nombre, ' - ', e.nombre),
  dj.nombre,
  dj.id,
  2,
  e.id,
  1
FROM distritos_judiciales dj
CROSS JOIN especialidades e
WHERE e.nombre IN ('CIVIL', 'COMERCIAL', 'CONTENCIOSO ADM.', 'DERECHO CONSTITUC', 'FAMILIA CIVIL', 'FAMILIA PENAL', 'FAMILIA TUTELAR', 'LABORAL')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- 3. JUZGADO MIXTO (instancia_id=3) con 8 especialidades
INSERT INTO directorio (tipo, nombre, distrito_judicial, distrito_judicial_id, instancia_id, especialidad_id, activo)
SELECT 
  'juzgado',
  CONCAT('Juzgado Mixto - ', dj.nombre, ' - ', e.nombre),
  dj.nombre,
  dj.id,
  3,
  e.id,
  1
FROM distritos_judiciales dj
CROSS JOIN especialidades e
WHERE e.nombre IN ('CIVIL', 'COMERCIAL', 'CONTENCIOSO ADM.', 'DERECHO CONSTITUC', 'FAMILIA CIVIL', 'FAMILIA PENAL', 'FAMILIA TUTELAR', 'LABORAL')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- 4. SALA SUPERIOR (instancia_id=4) con 7 especialidades
INSERT INTO directorio (tipo, nombre, distrito_judicial, distrito_judicial_id, instancia_id, especialidad_id, activo)
SELECT 
  'juzgado',
  CONCAT('Sala Superior - ', dj.nombre, ' - ', e.nombre),
  dj.nombre,
  dj.id,
  4,
  e.id,
  1
FROM distritos_judiciales dj
CROSS JOIN especialidades e
WHERE e.nombre IN ('CIVIL', 'COMERCIAL', 'FAMILIA CIVIL', 'FAMILIA PENAL', 'FAMILIA TUTELAR', 'LABORAL', 'PENAL')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- 5. SALA SUPREMA (instancia_id=5) - Sin especialidades por ahora
-- (No insertamos, pues no tiene especialidades definidas)

-- =========================================================
-- VERIFICACIÓN
-- =========================================================
SELECT 
  i.nombre AS instancia,
  COUNT(*) AS total_juzgados
FROM directorio d
LEFT JOIN instancias i ON i.id = d.instancia_id
WHERE d.tipo = 'juzgado'
GROUP BY d.instancia_id
ORDER BY i.orden;

SELECT 'TOTAL JUZGADOS INSERTADOS:' AS info, COUNT(*) FROM directorio WHERE tipo = 'juzgado' AND distrito_judicial_id IS NOT NULL;

-- Ejemplos de juzgados insertados
SELECT 
  nombre,
  distrito_judicial,
  instancia_id,
  especialidad_id
FROM directorio 
WHERE tipo = 'juzgado' AND distrito_judicial_id IS NOT NULL
LIMIT 20;
