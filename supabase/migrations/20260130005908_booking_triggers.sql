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
    --    IMPORTANTE: Debemos limpiar hold_expires_at para cumplir con constraint valid_hold.
    UPDATE bookings 
    SET status = 'CANCELLED',
        hold_expires_at = NULL,
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