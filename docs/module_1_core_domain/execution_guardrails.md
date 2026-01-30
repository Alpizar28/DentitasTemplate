# Módulo 1: Execution Guardrails & Checklist

> [!WARNING]
> **DOCUMENTO OPERATIVO.** Solo lectura para Implementadores.
> Si una tarea contradice este archivo, DETENERSE y consultar al Arquitecto.

## 1. Decisiones Congeladas (Frozen Decisions)
*   **Tiempo:** UTC Estricto (ISO-8601). Rango `[start, end)`. Sin timezones en tablas core.
*   **Concurrencia:** `EXCLUDE USING GIST (period WITH &&)`.
*   **Capacidad:** Siempre 1 por `resource_id`. (Clases grupales = N recursos o abstracción superior).
*   **Hold:** `HELD` status ocupa espacio físico.
*   **Expiración:** Lazy Trigger (`BEFORE INSERT` limpia holds expirados si hay colisión).
*   **IDs:** UUID v4 para todo.
*   **Value Objects:** `TimeSlotRequest` (Input) y `Actor` (JSONB) son contratos cerrados.

## 2. La Lista de los NO (Prohibiciones Estrictas)
❌ **NO** agregar campos de precio (`amount`, `currency`) a la tabla `bookings`.
❌ **NO** agregar referencias a `auth.users` (FKs) en `bookings`. Usar `booked_by` JSONB.
❌ **NO** implementar lógica de "Días Feriados" en el Core (pertenece a Config/Availability Rules, no al Booking Record).
❌ **NO** crear CRON JOBS para limpiar holds (Usar estrategia Lazy Trigger).
❌ **NO** confiar en el cliente para validar disponibilidad.
❌ **NO** desactivar constraints de BD para "casos especiales" de clientes.
❌ **NO** implementar notificaciones (Email/SMS) en este módulo.

## 3. Definition of Done (DoD) - Módulo 1
El módulo se considera terminado cuando existe lo siguiente en el repositorio:

### A. Base de Datos (Supabase/Postgres)
- [ ] Migration `.sql` aplicada que crea tipos (`booking_status`, `time_grain`).
- [ ] Migration `.sql` aplicada que crea tablas (`resources`, `bookings`, `availability_rules`).
- [ ] Constraint `EXCLUDE` verificada y funcuonal (Test que falle al insertar overlap).
- [ ] Trigger de "Lazy Expiration" implementado y testeado.

### B. Código (TypeScript/Backend)
- [ ] Interfaces Core (`Booking`, `Resource`, `TimeRange`) exportadas en `@/core/domain`.
- [ ] Función `createBooking(request: TimeSlotRequest)` implementada.
- [ ] Función `findAvailability(query)` implementada (calculando restas, no leyendo tablas pre-calculadas).

### C. Testing (Integration)
- [ ] **Test de Overlap:** Insertar A [10-11], Insertar B [10:30-11:30] -> DEBE FALLAR.
- [ ] **Test de Hold:** Insertar Hold A [10-11], Insertar B [10-11] -> DEBE FALLAR.
- [ ] **Test de Expiración:** Insertar Hold A (Expired), Insertar B [10-11] -> DEBE LIMPIAR A y ACEPTAR B.
- [ ] **Test de Atomicidad:** Rollback si falla una parte de la transacción.

## 4. Orden de Implementación Sugerido
1.  **SQL DDL:** Crear tipos y tablas básicas.
2.  **SQL Constraints:** Agregar `EXCLUDE` y verificar que revienta con solapamientos.
3.  **SQL Logic:** Implementar el Trigger de Lazy Expiration.
4.  **TS Domain:** Escribir las interfaces `.ts`.
5.  **TS Data Access:** Escribir las funciones de repositorio (respetando los VOs).
6.  **Tests:** Escribir los 4 tests críticos del DoD.

---
**Firma de Aprobación:** Módulo 1 Diseño (User & Antigravity) - 2026-01-29
