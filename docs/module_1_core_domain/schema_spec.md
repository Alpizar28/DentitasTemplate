# Módulo 1: Especificación Técnica de Esquema y Tipos

> [!NOTE]
> Este documento traduce el Diseño Arquitectónico (Conceptual) a estructuras de datos concretas (PostgreSQL y TypeScript).

## 1. Diseño de Base de Datos (PostgreSQL)

### A. Tipos Personalizados & Enums
Fundamental para garantizar integridad a nivel de base de datos.

```sql
-- Estados inmutables del ciclo de vida de la reserva
CREATE TYPE booking_status AS ENUM (
  'PENDING',      -- Creada, esperando acción (pago, confirmación manual)
  'HELD',         -- Slot bloqueado temporalmente (tiene expiration)
  'CONFIRMED',    -- Reserva firme
  'CANCELLED',    -- Cancelada (soft delete lógico)
  'COMPLETED',    -- El evento ocurrió
  'NO_SHOW'       -- El cliente no asistió
);

-- Unidad de tiempo (para flexibilidad de reglas)
CREATE TYPE time_grain AS ENUM (
  'MINUTES_15',
  'MINUTES_30',
  'MINUTES_60',
  'CUSTOM'        -- Definido por configuración numérica
);
```

### B. Tablas Principales (Core Domain)

#### 1. `resources` (El Tablero)
Representa la entidad que es reservada. Totalmente agnóstico.
*   **PK:** `id` (UUID)
*   **Unique:** `name` + `project_id` (Conceptualmente, manejado por Supabase RLS)
*   **Campos:**
    *   `name`: text
    *   `category`: text (opcional, para agrupar "Canchas", "Doctores")
    *   `is_active`: boolean (baja lógica)
    *   `metadata`: jsonb (Aquí va "Especialidad", "Tipo de Superficie", etc.)
    -- `timezone`: NO SE ALMACENA AQUÍ. El sistema opera 100% en UTC.
    -- La visualización local es responsabilidad del cliente/frontend.

#### 2. `bookings` (Las Piezas)
La tabla central del sistema.
*   **PK:** `id` (UUID)
*   **FK:** `resource_id` -> `resources(id)`
*   **Campos:**
    *   `period`: tstzrange (CRÍTICO: SIEMPRE UTC. Range [start, end). Semántica estricta.)
    *   `status`: booking_status
    *   `customer_id`: uuid (Referencia externa, o jsonb si es guest)
    *   `service_variant_id`: uuid (Referencia al tipo de servicio reservado)
    *   `hold_expires_at`: timestamptz (Nullable. Si status=HELD y now() > esto, se considera libre)
    *   `metadata`: jsonb (Notas, respuestas de formulario custom)
*   **Constraints:**
    *   `EXCLUDE USING gist (resource_id WITH =, period WITH &&)`
        *   *Explicación:* Impide físicamente que dos filas tengan el mismo `resource_id` y sus `period` se solapen. Es la garantía absoluta de NO OVERBOOKING.
        *   *Nota:* Esto implica CAPACIDAD = 1. Para capacidad > 1, usar múltiples recursos o abstracción superior.
        *   *Nota:* Solo aplica si `status` != 'CANCELLED'. (Requiere índice parcial o condición).

#### 3. `availability_rules` (La Grilla)
Define cuándo el recurso *existe* temporalmente.
*   **PK:** `id` (UUID)
*   **FK:** `resource_id` -> `resources(id)` (Nullable si es regla global del negocio)
*   **Campos:**
    *   `day_of_week`: integer (0-6)
    *   `start_time`: time
    *   `end_time`: time
    *   `is_override`: boolean (Si true, es una excepción de fecha específica)
    *   `specific_date`: date (Nullable, solo si is_override=true)
    *   `type`: string ('OPEN', 'CLOSED', 'BREAK')

---

## 2. Definiciones TypeScript (Core Interfaces)

Estas interfaces serán la "lengua franca" del backend.

### A. Primitivas de Dominio
```typescript
type ISO8601DateTime = string; // "2024-01-01T10:00:00Z"
type UUID = string;

// El corazón del manejo de tiempo
interface TimeRange {
  start: ISO8601DateTime;
  end: ISO8601DateTime;
}

// Representación de un Slot disponible (Calculado)
interface AvailabilitySlot extends TimeRange {
  resourceId: UUID;
  status: 'AVAILABLE';
}
```

### B. Entidades del Core
```typescript
interface Resource {
  id: UUID;
  name: string;
  categoryId?: string;
  // timezone: string; // ELIMINADO. El backend es agnóstico de TZs locales.
  isActive: boolean;
  // Metadata es flexible pero tipada genéricamente
  metadata: Record<string, unknown>;
}

interface Booking {
  id: UUID;
  resourceId: UUID;
  serviceVariantId: UUID; // Qué se reservó
  customerId: UUID | null; // Null si es guest o admin block
  
  // Tiempo
  period: TimeRange;
  
  // Estado
  status: 'PENDING' | 'HELD' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  holdExpiresAt?: ISO8601DateTime; // Solo válido si status === 'HELD'
  
  // Datos extendidos
  metadata: Record<string, unknown>;
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
}
```

### C. Input Objects (Command Pattern)
Para interactuar con el Booking Engine.

```typescript
// Comando: "Quiero reservar esto"
interface CreateBookingCommand {
  resourceId: UUID;
  serviceVariantId: UUID;
  start: ISO8601DateTime;
  durationMinutes: number; // El Engine calcula el end
  customerId?: UUID;
  metadata?: Record<string, unknown>;
}

// Query: "¿Qué hay libre?"
interface FindAvailabilityQuery {
  range: TimeRange;          // "Dame disponibilidad para la próxima semana"
  resourceIds?: UUID[];      // "De estos doctores" o "Cualquiera" (si array vacío)
  requiredDurationMinutes: number; // "Necesito un hueco de 45 mins"
}
```

---

## 3. Estrategia de Constraints & Edge Cases

### Manejo de Overlaps (Solapamientos)
La constraint `EXCLUDE` de Postgres es poderosa pero rígida.
*   **Problema:** A veces queremos permitir "Double Booking" intencional (ej. una clase de yoga con cupo 10).
*   **Solución para Módulo 1:**
    *   El Core Base asume **Capacidad = 1** (Modelo estricto).
    *   Para soportar Capacidad N, se modelará en Módulo 2 mediante "Inventory Units" o sub-recursos virtuales, NO debilitando la constraint del Core.
    *   *Regla de Oro:* Si un `resource_id` tiene exclusion constraint, es capacidad 1. Si necesitas capacidad 10, creas 10 sub-recursos o usas un modelo de agregación superior, pero el nivel `atomic` siempre es seguro.

### Manejo de Timezones
*   Postgres guarda en UTC (`timestamptz`).
*   El cliente manda UTC.
*   El cálculo de reglas ("Abierto de 9 a 5") se hace convirtiendo el UTC almacenado a la timezona del *Recurso* en tiempo de ejecución.
*   **Nunca** guardar horas locales en columnas de timestamp.

### Integridad de ID de Recurso
*   No usar `serial` integer.
*   UUID v4 para todo.
*   Permite sharding y evita "adivinar" IDs de otros clientes.
