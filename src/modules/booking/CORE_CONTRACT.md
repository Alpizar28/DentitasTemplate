# Booking Core Contract & Integration Guidelines

> **Status:** ACTIVE  
> **Type:** Architectural Contract  
> **Module:** `src/modules/booking`

Este documento define las garantías, limitaciones y precondiciones formales del **Booking Core (Módulo 1)**. Todo consumidor (API, Frontend, CLI) debe adherirse a estas reglas.

---

## 1. Responsabilidad Única: **Integridad Transaccional**

El Booking Core tiene una única misión crítica: **Garantizar que NO existan reservas solapadas inválidas en la base de datos.**

### ✅ Lo que el Core GARANTIZA
1.  **Integridad Física (Exclusion Constraints):** Es técnicamente imposible persistir dos reservas con estados activos (`HELD`, `CONFIRMED`) en el mismo `resource_id` y `period` solapado. La base de datos rechazará la transacción con error `23P01`.
2.  **Transiciones de Estado Válidas (FSM):** Un booking solo puede moverse según el grafo dirigido permitido (ej. `PENDING` -> `HELD` -> `CONFIRMED`). No existen "saltos mágicos" ni estados indefinidos.
3.  **Limpieza Atómica (Lazy Cleanup):** Si una reserva está en estado `HELD` y su tiempo `hold_expires_at` ha pasado, el Core la tratará como inexistente (o la limpiará activamente) al intentar insertar una nueva reserva en ese hueco.
4.  **Auditoría Básica:** Todo cambio de estado registra `updated_at` y mantiene metadata de trazabilidad.

### ❌ Lo que el Core NO GARANTIZA (Y no debe saber)
1.  **Horarios Laborales:** El Core **NO SABE** si el `resource_id` abre a las 9 AM o si es feriado. Si le pides reservar un domingo a las 3 AM y no choca con nadie, lo permitirá.
    *   *Responsable:* **Availability Engine (Módulo 2)**.
2.  **Reglas de Negocio Complejas (Business Rules):** El Core no sabe si "Juan" tiene saldo o si "Maria" está bloqueada, salvo que se inyecte una `IPolicy` explícita que lo valide.
3.  **Duración de Servicios:** El Core acepta cualquier `TimeRange` válido (inicio < fin). No valida si el servicio "Corte de Pelo" debe durar 30 o 45 minutos.

---

## 2. Precondiciones de Integración

Cualquier sistema que llame a `BookingRepository.createHold()` o `PolicyEngine.evaluate()` debe cumplir el siguiente contrato:

> **⚠️ PRECONDICIÓN CRÍTICA: Availability First**
> El consumidor DEBE haber consultado previamente al **Availability Service**.
> El slot enviado al Core DEBE ser un slot que el Availability Service marcó como libre.

**Flujo Correcto:**
1.  Frontend -> `AvailabilityService.getSlots(date)` -> Retorna `[10:00, 11:00]`
2.  Usuario selecciona `10:00`.
3.  Frontend -> `BookingCore.createHold(10:00, 11:00)`.

**Flujo Incorrecto (Riesgo):**
*   Frontend calcula "a ojo" que hay hueco y llama directo al Core.
*   *Consecuencia:* Se pueden crear reservas fuera de horario laboral o ignorando reglas de descanso.

---

## 3. Configuración y Entorno

### Strict Mode (Producción)
En entorno `production`, el Core **fallará al iniciar** (Throw Error) si no detecta configuración crítica cargada para las Políticas Activas. No se asumen *"defaults"* en producción para evitar reglas de negocio accidentales.

### Health Check (Infraestructura)
El Core depende de mecanismos de BD (Triggers/Constraints). Antes de aceptar tráfico, el sistema debe ejecutar el **Health Check de Infraestructura** para validar:
1.  Existencia de extensión `btree_gist`.
2.  Existencia de constraint `EXCLUDE` en tabla `bookings`.
3.  Existencia de trigger de limpieza (`trg_lazy_cleanup_holds`).

---

## 4. Gestión de Errores

| Tipo de Error | Significado | Acción Sugerida al Cliente |
| :--- | :--- | :--- |
| `OverlapError` | Colisión física de slots. | "El turno acaba de ser ocupado. Por favor elija otro." |
| `PolicyDenied` | Regla de negocio infringida (ej. Lead Time). | Mostrar mensaje: `trace.message` |
| `InvalidTransition` | Intento de cambio de estado ilegal. | Error de sistema / Bug en UI. |
| `HoldExpired` | Se intentó confirmar un hold vencido. | "Su reserva expiró. Inicie nuevamente." |
