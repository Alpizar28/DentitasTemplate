# Módulo 2: Availability Engine Design

> **Status:** DRAFT (Design Phase)  
> **Module:** `src/modules/booking/application/availability`  
> **Dependencies:** Booking Core (Read-Only), ConfigService

Este documento especifica el diseño técnico del Motor de Disponibilidad. Su objetivo es responder determinísticamente a la pregunta *"¿Qué slots hay disponibles?"* basándose en configuración (horarios) y estado actual (reservas), sin acoplar reglas de negocio al Booking Core transaccional.

---

## 1. Principios de Diseño
1.  **Schedule Agnostic Core**: El Core de reservas (`bookings` table) no sabe de horarios. El Availability Engine es quien interpreta y valida el tiempo.
2.  **Config-Driven**: Toda definición de Turnos (`Shifts`), Descansos (`Breaks`) y Excepciones viene de configuración (JSON en BD), permitiendo cambios en caliente sin despliegue.
3.  **Determinismo**: `f(Config, Bookings, Request) -> Slots`. Mismo input, siempre mismo output.
4.  **No UI Dependency**: El motor opera en Dominio/Aplicación, agnóstico de quién lo llama (API, CLI, UI).
5.  **Timezone Explicit**: Todos los cálculos internos se normalizan a UTC, pero responden respetando la Timezone configurada del negocio/recurso.

---

## 2. Modelo de Dominio (Conceptual)

### 2.1 Entidades y Value Objects

*   **`Schedule`**: Agregado raíz que contiene la configuración de tiempo para un recurso o negocio.
    *   *Fuente:* `app_config` (Key: `SCHEDULE_DEFAULT` o `SCHEDULE:resource_id`).
*   **`Shift`**: Un bloque de tiempo recurrente donde se ofrece servicio (ej. "Lunes 09:00-13:00").
    *   *Props:* `dayOfWeek`, `startTime`, `endTime`, `effectiveDateRange` (validez).
*   **`Break`**: Rango dentro de un shift donde NO se da servicio (ej. "Almuerzo 13:00-14:00").
*   **`ExceptionRule`**: Regla que sobrescribe el patrón recurrente.
    *   *Tipos:* `CLOSED_DAY` (Feriado), `MODIFIED_HOURS` (Horario especial), `BLACKOUT` (Bloqueo ad-hoc).
*   **`ServiceConfiguration`**: Reglas específicas del servicio solicitado.
    *   *Props:* `durationMinutes`, `bufferBefore`, `bufferAfter`, `slotGranularity` (ej. cada 15 min).
*   **`AvailabilitySlot`**: Resultado final "bookeable".
    *   *Props:* `start`, `end`, `resourceId`, `capacityRemaining`.

---

## 3. Modelo de Configuración (JSON Schema)

Decisión de diseño: **JSON en `app_config`**. Evita complejidad relacional prematura.

```json
{
  "timezone": "America/Mexico_City",
  "weeklyShifts": [
    { "days": [1, 2, 3, 4, 5], "start": "09:00", "end": "18:00" }, // Lunes-Viernes
    { "days": [6], "start": "10:00", "end": "14:00" }              // Sábados
  ],
  "globalBreaks": [
    { "name": "Lunch", "start": "13:00", "end": "14:00", "days": [1,2,3,4,5] }
  ],
  "exceptions": [
    { "date": "2024-12-25", "type": "CLOSED", "reason": "Christmas" },
    { "date": "2024-12-31", "type": "MODIFIED", "start": "09:00", "end": "13:00" }
  ],
  "services": {
    "default": { "duration": 60, "granularity": 60 },
    "consultation": { "duration": 45, "granularity": 15, "bufferAfter": 5 }
  }
}
```

---

## 4. Algoritmo de Disponibilidad (Pipeline)

`getSlots(resourceId, dateRange, serviceId)`

1.  **Load Context**:
    *   Leer `ScheduleConfig` (fusión: Default + Resource Override).
    *   Resolver `TimeZone` efectivo.
    *   Leer `ServiceConfig` (duración, buffers).
2.  **Generate Base Timeline**:
    *   Para cada día del `dateRange`:
        *   Determinar si es día con `Exception` (Closed? Modified?).
        *   Si no, aplicar `WeeklyShifts`.
    *   Resultado: Lista de `TimeRange` operativos brutos (ej. 09-18).
3.  **Subtract Breaks**:
    *   Restar `GlobalBreaks` de los rangos operativos.
    *   Resultado: Lista de `TimeRange` netos (ej. 09-13, 14-18).
4.  **Apply Busy Slots (The interaction with Core)**:
    *   Consultar `BookingRepository.findActiveOverlapping(dateRange)` (Confirmed + Held).
    *   Restar ocupación.
        *   *Capacity Mode*: Si `capacity > 1`, solo restar si `count(bookings) >= capacity`.
    *   Resultado: Lista de `TimeRange` libres fragmentados.
5.  **Slot Generation**:
    *   Recorrer los rangos libres.
    *   Dividir en slots según `granularity` y `ServiceDuration + Buffers`.
    *   Validar que el slot completo (Start -> End + Buffer) cabe en el rango libre.
6.  **Final Output**:
    *   Retornar array de `AvailabilitySlot`.

---

## 5. Integración con Booking Core

El Availability Engine es un **servicio de dominio** (`AvailabilityService`) que orquesta, pero el **Core Repository** es la fuente de verdad de la ocupación.

### Contratos / Puertos
*   `IScheduleRepository`: Obtiene la configuración de horarios (adaptador a `SupabaseConfigRepository`).
*   `IBookingReadRepository`: Obtiene reservas activas (adaptador optimizado a `Supabase`).

### Precondición en UseCases
Antes de `CreateBookingUseCase`, el flujo de aplicación debe llamar a `AvailabilityService.validateSlot(request)`.
*   Si el slot no coincide con uno generado por el engine -> **Error: SlotUnavailableException**.

---

## 6. Testing Strategy (Escenarios Obligatorios)

La suite de pruebas (`availability.spec.ts`) debe cubrir:
1.  **Shift Simple**: Turno 9-18 sin reservas.
2.  **Breaks**: Slot que choca con el almuerzo es inválido.
3.  **Exception**: Días feriados retornan 0 slots.
4.  **Occupied**: Reserva existente elimina el slot correspondiente.
5.  **Granularity**: Servicio de 45m en grilla de 15m.
6.  **Buffer**: Servicio de 50m + 10m buffer = Bloque de 60m real.
7.  **Edge Timezone**: Petición cruzando cambio de día en UTC vs Local.
8.  **Capacity**: Si cap=2 y hay 1 reserva, el slot sigue disponible.

---

## 7. Migration Plan (Playground)

1.  Crear `SmartAvailabilityService` (implementación real).
2.  Mantener `DummyAvailabilityService` temporalmente o reemplazarlo inyectando una configuración "hardcodeada" en el `ConfigService` de prueba que emule el comportamiento anterior (Shift 9-18).
3.  Actualizar `actions.ts` para usar el nuevo servicio.
