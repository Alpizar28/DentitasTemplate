-- Módulo 1 (Paso A3): Lazy Atomic Hold Cleanup
-- Objetivo: Liberar espacio ocupado por 'HELD' expirados atómicamente al intentar reservar.

CREATE OR REPLACE FUNCTION ensure_availability_and_cleanup()
RETURNS TRIGGER AS $$
DECLARE
  conflicting_row RECORD;
BEGIN
  -- 1. Buscamos SI EXISTE algún booking que conflicto
  --    PERO solo nos interesan los que sean HELD + Expirados.
  --    Los CONFIRMED o HELD activos nos darán error de EXCLUDE de todas formas.
  
  FOR conflicting_row IN
    SELECT id 
    FROM bookings
    WHERE resource_id = NEW.resource_id
      AND period && NEW.period -- Intersección (Overlap)
      AND status = 'HELD'
      AND hold_expires_at <= NOW() -- YA VENCIDO
    ORDER BY created_at ASC -- Orden determinista para locks
    FOR UPDATE SKIP LOCKED -- Evitar deadlock si otro proceso ya lo está limpiando
  LOOP
    -- 2. "Invalidamos" el hold muerto. 
    --    Usamos 'CANCELLED' para que deje de molestar al constraint EXCLUDE.
    UPDATE bookings 
    SET status = 'CANCELLED',
        metadata = jsonb_set(metadata, '{cleanup_reason}', '"lazy_expiration_trigger"')
    WHERE id = conflicting_row.id;
    
    -- Nota: Al hacer esto, la constraint EXCLUDE (que filtra status IN ('HELD', 'CONFIRMED'))
    -- automáticamente deja de ver este registro como conflictivo.
  END LOOP;

  -- 3. Retornamos NEW para que el INSERT proceda.
  --    Si quedaba algún conflicto REAL (Confirmed o Held activo), 
  --    la constraint EXCLUDE saltará justo después de este trigger.
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger BEFORE INSERT
-- Debe correr ANTES de que el constraint check ocurra para limpiar el camino.
CREATE TRIGGER trg_lazy_cleanup_holds
BEFORE INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION ensure_availability_and_cleanup();

/*
---------------------------------------------------------
FLUJO TRANSACCIONAL (Lazy Atomic)
---------------------------------------------------------

1.  Usuario envia INSERT Booking (NEW).
2.  Postgres inicia transacción implícita.
3.  Se dispara trigger BEFORE INSERT `trg_lazy_cleanup_holds`.
4.  La función busca colisiones *específicas* con HELD expirados.
5.  Usa `FOR UPDATE SKIP LOCKED` para bloquear los renglones expirados sin esperar a otros procesos de limpieza.
6.  Ejecuta UPDATE status='CANCELLED' en los expirados encontrados.
7.  El trigger termina y retorna NEW.
8.  Postgres intenta aplicar constraints (EXCLUDE).
9.  Como el viejo expirado ahora es 'CANCELLED', el predicado WHERE (status IN 'HELD','CONFIRMED') lo ignora.
10. Si no hay otros conflictos (ej. un CONFIRMED real), el INSERT tiene éxito.
11. Commit atómico: Se guarda el nuevo Y se mata el viejo en un solo paso.

---------------------------------------------------------
PRUEBAS MANUALES (SQL Logic)
---------------------------------------------------------

-- Setup
TRUNCATE bookings;
INSERT INTO resources (id, name) VALUES ('22222222-2222-2222-2222-222222222222', 'Trigger Test Resource');

-- a) HELD expirado colisiona -> se invalida el viejo y el nuevo insert pasa
INSERT INTO bookings (resource_id, period, status, hold_expires_at, booked_by, metadata)
VALUES ('22222222-2222-2222-2222-222222222222', '[2024-01-01 10:00:00+00, 2024-01-01 11:00:00+00)', 'HELD', NOW() - interval '1 minute', '{"id":"expired"}'::jsonb, '{"note":"expired"}'::jsonb);
-- Insertamos el nuevo encima
INSERT INTO bookings (resource_id, period, status, hold_expires_at, booked_by)
VALUES ('22222222-2222-2222-2222-222222222222', '[2024-01-01 10:00:00+00, 2024-01-01 11:00:00+00)', 'CONFIRMED', NULL, '{"id":"winner"}'::jsonb);
-- RESULTADO ESPERADO: Success. El primero queda CANCELLED.

-- b) HELD activo colisiona -> insert falla por EXCLUDE
INSERT INTO bookings (resource_id, period, status, hold_expires_at, booked_by)
VALUES ('22222222-2222-2222-2222-222222222222', '[2024-01-01 12:00:00+00, 2024-01-01 13:00:00+00)', 'HELD', NOW() + interval '10 minutes', '{"id":"active"}'::jsonb);
-- Intento colisión
INSERT INTO bookings (resource_id, period, status, hold_expires_at, booked_by)
VALUES ('22222222-2222-2222-2222-222222222222', '[2024-01-01 12:30:00+00, 2024-01-01 13:30:00+00)', 'CONFIRMED', NULL, '{"id":"intruder"}'::jsonb);
-- RESULTADO ESPERADO: ERROR exclusion constraint. Trigger no limpia porque no expiró.

-- c) CONFIRMED colisiona -> insert falla por EXCLUDE
INSERT INTO bookings (resource_id, period, status, booked_by)
VALUES ('22222222-2222-2222-2222-222222222222', '[2024-01-01 14:00:00+00, 2024-01-01 15:00:00+00)', 'CONFIRMED', '{"id":"owner"}'::jsonb);
-- Intento colisión
INSERT INTO bookings (resource_id, period, status, booked_by)
VALUES ('22222222-2222-2222-2222-222222222222', '[2024-01-01 14:00:00+00, 2024-01-01 15:00:00+00)', 'HELD', NOW() + interval '5m', '{"id":"intruder"}'::jsonb);
-- RESULTADO ESPERADO: ERROR exclusion constraint.

-- d) CANCELLED no colisiona -> insert pasa
UPDATE bookings SET status = 'CANCELLED' WHERE resource_id = '22222222-2222-2222-2222-222222222222' AND period = '[2024-01-01 14:00:00+00, 2024-01-01 15:00:00+00)';
-- Intento nuevo
INSERT INTO bookings (resource_id, period, status, booked_by)
VALUES ('22222222-2222-2222-2222-222222222222', '[2024-01-01 14:00:00+00, 2024-01-01 15:00:00+00)', 'CONFIRMED', '{"id":"new_owner"}'::jsonb);
-- RESULTADO ESPERADO: Success.

-- e) 2 inserts concurrentes -> uno falla
-- (Difícil probar manual secuencial, pero conceptualmente el Transaction Isolation Level + Lock de GIST lo garantiza).
*/
