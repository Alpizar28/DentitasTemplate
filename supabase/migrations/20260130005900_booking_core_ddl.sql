-- Módulo 1: Core Domain DDL
-- Diseño Congelado en: docs/module_1_core_domain/final_design_decisions.md
-- Módulo 1: Core Domain DDL
-- Diseño Congelado en: docs/module_1_core_domain/final_design_decisions.md

-- 0. EXTENSIONES (Necesarias para índices GIST mixtos UUID+Range)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 1. ENUMS (Immutable)
CREATE TYPE booking_status AS ENUM (
  'PENDING',      -- Reserva creada, esperando confirmación
  'HELD',         -- Bloqueo temporal (ocupa espacio físico)
  'CONFIRMED',    -- Reserva final firme
  'CANCELLED',    -- Soft delete / cancelada
  'COMPLETED',    -- Evento pasado exitosamente
  'NO_SHOW'       -- Cliente no asistió
);

CREATE TYPE time_grain AS ENUM (
  'MINUTES_15',
  'MINUTES_30',
  'MINUTES_60',
  'CUSTOM'
);

-- 2. RESOURCES (Atomic Capacity = 1)
-- Representa una unidad física o lógica indivisible.
CREATE TABLE resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text, -- Opcional, solo para agrupación lógica simple
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. BOOKINGS (The Truth)
-- La tabla central. Inmutable en su esencia temporal.
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid NOT NULL REFERENCES resources(id),
  
  -- TIEMPO (Core): Rango UTC estricto [start, end)
  period tstzrange NOT NULL,
  
  -- ESTADO Y CICLO DE VIDA
  status booking_status NOT NULL DEFAULT 'PENDING',
  
  -- CONCURRENCIA (Lazy Expiration Strategy)
  hold_expires_at timestamptz, -- NULL si status != HELD
  
  -- IDENTIDAD (Agnóstica)
  booked_by jsonb NOT NULL, -- { "type": "USER|GUEST", "id": "...", "details": {} }
  
  -- CONTEXTO DE NEGOCIO (Flexible)
  -- service_ref es un puntero opaco al "tipo de servicio" (ej. "corte-pelo-varon")
  -- El core no valida si existe, solo lo guarda.
  service_ref text, 
  metadata jsonb DEFAULT '{}'::jsonb,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- VALIDACIONES DE INTEGRIDAD BÁSICA
  CONSTRAINT valid_period CHECK (isempty(period) IS FALSE), -- No rangos vacíos
  CONSTRAINT valid_hold CHECK (
    (status = 'HELD' AND hold_expires_at IS NOT NULL) OR 
    (status != 'HELD' AND hold_expires_at IS NULL)
  )
);

-- 4. AVAILABILITY RULES (CANDIDATE / UNUSED IN M1 CORE LOGIC)
-- Estructura mínima. NO participa en constraints ni triggers del Booking Engine en M1.
-- Solo existe como repositorio de datos para consultas de UI/Frontend.
CREATE TABLE availability_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid REFERENCES resources(id), -- NULL = Regla Global
  
  day_of_week integer CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  
  type text NOT NULL DEFAULT 'OPEN', -- OPEN, EXTENDED, etc.
  
  is_override boolean DEFAULT false,
  specific_date date, -- Si is_override=true

  created_at timestamptz DEFAULT now()
);

-- 5. ÍNDICES RECOMENDADOS (Performance)
CREATE INDEX idx_bookings_resource_period ON bookings USING gist (resource_id, period);
CREATE INDEX idx_bookings_status ON bookings(status);