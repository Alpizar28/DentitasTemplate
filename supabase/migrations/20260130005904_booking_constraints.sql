-- Módulo 1 (Paso A2): Hardening & Concurrencia
-- Objetivo: Prevenir overbooking físico usando EXCLUDE constraints.

-- 1. Habilitar extensión necesaria para índices GIST mixtos (UUID + Range)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. Constraints de Exclusión (The "Traffic Cop")
-- Esta constraint garantiza que ningún par de filas tengan:
--   a) El mismo resource_id
--   b) Solapamiento en period (&&)
--   c) UNICAMENTE si status IN ('HELD', 'CONFIRMED')

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