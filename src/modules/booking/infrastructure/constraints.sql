-- Módulo 1 (Paso A2): Hardening & Concurrencia
-- Objetivo: Prevenir overbooking físico usando EXCLUDE constraints.

-- 1. Habilitar extensión necesaria para índices GIST mixtos (UUID + Range)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. Constraints de Exclusión (The "Traffic Cop")
-- Esta constraint garantiza que ningún par de filas tengan:
--   a) El mismo resource_id
--   b) Solapamiento en period (&&)
--   c) UNICAMENTE si status NO es 'CANCELLED' (ni otros terminales irrelevantes si hubiera)
--
-- NOTA: Postgres no permite cláusula WHERE directa en constraints EXCLUDE.
-- ESTRATEGIA: Usamos una exclusion constraint funcional o incluimos el status
-- si queremos filtrar.
-- PERO: Como queremos EXCLUIR solapamientos para 'PENDING', 'HELD', 'CONFIRMED', 
-- y PERMITIR solapamientos para 'CANCELLED', la forma más limpia en Postgres puro
-- sin índices parciales complejos es simplemente excluir.
--
-- La decisión de diseño congelada dice: "Solo aplica si status != CANCELLED".
-- Postgres EXCLUDE soporta "WHERE (predicate)". Usaremos eso.

-- LA REGLA DE ORO DE OCUPACIÓN:
-- Solo 'HELD' y 'CONFIRMED' ocupan un slot activo.
-- 'COMPLETED', 'NO_SHOW', 'CANCELLED' son históricos/auditoría y no impiden nuevas reservas.
ALTER TABLE bookings
ADD CONSTRAINT no_overlap_in_active_bookings
EXCLUDE USING gist (
  resource_id WITH =,
  period WITH &&
)
WHERE (status IN ('HELD', 'CONFIRMED'));

-- 3. VALIDACIÓN DE SEMÁNTICA [Start, End)
-- Postgres 'tstzrange' por defecto es '[)', lo cual es perfecto.
-- La constraint '&&' (overlap) maneja correctamente los bordes.
-- [10, 11) && [11, 12) -> false (No overlap, CORRECTO).

/*
---------------------------------------------------------
PLAN DE PRUEBAS MANUALES (SQL)
---------------------------------------------------------

-- Setup: Crear Recurso
INSERT INTO resources (id, name) VALUES ('11111111-1111-1111-1111-111111111111', 'Tennis Court 1');

-- a) HELD vs HELD overlap (DEBE FALLAR)
INSERT INTO bookings (resource_id, period, status, hold_expires_at, booked_by)
VALUES ('11111111-1111-1111-1111-111111111111', '[2024-01-01 10:00:00+00, 2024-01-01 11:00:00+00)', 'HELD', now() + interval '10m', '{"id":"u1"}'::jsonb);
-- Success

INSERT INTO bookings (resource_id, period, status, hold_expires_at, booked_by)
VALUES ('11111111-1111-1111-1111-111111111111', '[2024-01-01 10:30:00+00, 2024-01-01 11:30:00+00)', 'HELD', now() + interval '10m', '{"id":"u2"}'::jsonb);
-- ERROR: conflicting key value violates exclusion constraint "no_overlap_in_active_bookings"

-- b) CONFIRMED vs HELD overlap (DEBE FALLAR)
INSERT INTO bookings (resource_id, period, status, hold_expires_at, booked_by)
VALUES ('11111111-1111-1111-1111-111111111111', '[2024-01-01 10:00:00+00, 2024-01-01 11:00:00+00)', 'CONFIRMED', NULL, '{"id":"u3"}'::jsonb);
-- ERROR: conflicting key value (si el HELD anterior existiera).

-- c) CANCELLED no bloquea (DEBE PASAR)
-- Primero cancelamos el HELD existente
UPDATE bookings SET status = 'CANCELLED', hold_expires_at = NULL WHERE resource_id = '11111111-1111-1111-1111-111111111111';
-- Ahora insertamos uno nuevo en el mismo horario
INSERT INTO bookings (resource_id, period, status, hold_expires_at, booked_by)
VALUES ('11111111-1111-1111-1111-111111111111', '[2024-01-01 10:00:00+00, 2024-01-01 11:00:00+00)', 'CONFIRMED', NULL, '{"id":"u4"}'::jsonb);
-- Success

-- d) HELD expirado (DEBE FALLAR AQUÍ - Manejado por Trigger en Paso A3)
-- Sin el trigger, la DB rechaza el insert aunque el hold esté expirado. Esto es correcto para la capa física.

-- e) No-overlap contiguo (DEBE PASAR)
INSERT INTO bookings (resource_id, period, status, hold_expires_at, booked_by)
VALUES ('11111111-1111-1111-1111-111111111111', '[2024-01-01 11:00:00+00, 2024-01-01 12:00:00+00)', 'CONFIRMED', NULL, '{"id":"u5"}'::jsonb);
-- Success (11:00 es el fin del anterior y el inicio de este)
*/
