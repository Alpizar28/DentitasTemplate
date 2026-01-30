# Módulo 1: Decisiones de Diseño Final & Límites (Core Domain)

Este documento congela las decisiones arquitectónicas para el Módulo 1.

> [!IMPORTANT]
> **Estado:** FUNGIBLE & FROZEN.
> Cualquier desviación de este documento constituye una violación del Core.

## 1. Límites del Módulo 1 (Core vs Candidate)

### ✅ Core Innegociable (Frozen)
Estos elementos SON el sistema.
1.  **Modelo de Tiempo:** `TSTZRANGE` en base de datos.
2.  **Modelo de Concurrencia:** `EXCLUDE constraint (WITH &&)` en `bookings`.
3.  **Capacidad Atómica:** `Resource` representa 1 unidad de capacidad indivisible.
4.  **Hold Mechanism:** `HELD` ocupa espacio físico.
5.  **Invariant Strategy:** Limpieza lazy atómica de holds.

### 📝 Implementación Candidata (Flexible)
2.  **Metadata Internals:** Estructura de jsonb.
3.  **Naming de API:** Nombres de endpoints o DTOs externos.

---

## 2. Invariant Guarantees (Las Promesas del Core)

El Core asegura matemáticamente (sin depender de código de aplicación):
1.  **No-Overlap:** Imposible tener dos reservas activas (`CONFIRMED` o `HELD`) solapadas en el mismo recurso.
2.  **Atomicidad:** Una reserva existe completamente o no existe. No hay estados parciales.
3.  **Temporal Consistency:** El tiempo es continuo y lineal (UTC). No hay huecos por zonas horarias.
4.  **Self-healing Availability:** La disponibilidad se recupera automáticamente si un Hold expira, sin intervención administrativa.

---

## 3. Decisiones de Diseño Críticas (Cierre de Huecos)

### A. Estrategia de Expiración de Holds (Lazy Atomic)
*   **Problema:** `EXCLUDE` bloquea inserts incluso si el row conflictivo es un `HELD` expirado.
*   **Solución Canónica:** Trigger `BEFORE INSERT`.
*   **Mecanismo:**
    1.  Al intentar insertar un Booking `B_new`.
    2.  El motor ejecuta trigger `ensure_availability`.
    3.  El trigger busca bookings `B_exist` donde:
        *   `resource_id = B_new.resource_id`
        *   `period && B_new.period` (Intersección)
        *   `status = 'HELD'`
        *   `hold_expires_at < NOW()` (Ya expiró)
    4.  Si encuentra tal `B_exist`, ejecuta `UPDATE set status = 'CANCELLED'` sobre él.
    5.  El insert de `B_new` procede (ahora sin conflicto).
*   **Por qué:** Mantiene la integridad sin Cron Jobs. El costo de limpieza lo paga quien necesita el espacio.

### B. TimeSlotRequest VO (Contrato Congelado)
La unidad mínima de comunicación con el Core para solicitar espacio.
*   **Semántica:** "Intento reservar [Start, End) en Resource X".
*   **Estructura JSON/Interface:**
    ```typescript
    interface TimeSlotRequest {
      resourceId: string; // UUID
      start: string;      // ISO-8601 UTC
      end: string;        // ISO-8601 UTC
      type: 'CUSTOMER' | 'ADMIN_BLOCK'; // Determina validaciones extra en capas sup.
    }
    ```
*   **Regla:** `end > start`.

### C. Actor VO (Contrato Congelado)
Identidad agnóstica para auditoría y propiedad.
*   **Almacenamiento:** Columna `booked_by` (JSONB) en tabla `bookings`.
*   **Schema:**
    ```typescript
    interface BookingActor {
      type: 'USER' | 'GUEST' | 'SYSTEM' | 'API';
      id: string; // "usr_123" | "guest_session_xyz" | "sys_cron"
      details?: {
        name?: string;
        email?: string;
        ip?: string;
      };
    }
    ```
*   **Justificación:** Permite reservas anónimas, de terceros o de sistema sin FK a `auth.users`.

---

## 4. Resumen de Diseño (Reference)

### Modelo de Tiempo
*   **UTC ONLY**. `[start, end)`.

### FSM (Máquina de Estados)
*   `PENDING` -> `HELD` (Start)
*   `HELD` -> `CONFIRMED` (Success)
*   `HELD` -> `CANCELLED` (Expire/User Cancel)
*   `CONFIRMED` -> `CANCELLED` (Refund/Cancel)
*   `CONFIRMED` -> `COMPLETED` | `NO_SHOW` (Post-event)

### Capacidad
*   **SIEMPRE 1**. Overbooking imposible por diseño.

### Congelado
*   No pedir cambios a `bookings` para agregar lógica de negocio (precios, items). Usar tablas satélite (`booking_line_items`).
*   No pedir desactivar constraint `EXCLUDE`.
