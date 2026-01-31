-- Módulo 1 (Paso A4): Infrastructure Health Check RPC
-- Objetivo: Permitir al código backend validar que la DB tiene la integridad esperada.

CREATE OR REPLACE FUNCTION check_booking_infra_health()
RETURNS TABLE (
    check_name text,
    passed boolean,
    details text
) AS $$
DECLARE
    has_constraint boolean;
    has_trigger boolean;
BEGIN
    -- 1. Check Constraint
    SELECT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'no_overlap_in_active_bookings'
    ) INTO has_constraint;

    check_name := 'Constraint: no_overlap_in_active_bookings';
    passed := has_constraint;
    details := CASE WHEN has_constraint THEN 'Present' ELSE 'MISSING: Core integrity compromised' END;
    RETURN NEXT;

    -- 2. Check Lazy Cleanup Trigger
    SELECT EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgname = 'trg_lazy_cleanup_holds'
    ) INTO has_trigger;

    check_name := 'Trigger: trg_lazy_cleanup_holds';
    passed := has_trigger;
    details := CASE WHEN has_trigger THEN 'Present' ELSE 'MISSING: Expired holds will block slots' END;
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
