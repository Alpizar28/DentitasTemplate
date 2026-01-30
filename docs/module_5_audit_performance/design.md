# Módulo 5: Auditoría, Performance y Validación Final

**Estado:** Diseño Propuesto  
**Fecha:** 2026-01-29  
**Dependencias:** M1 (Core), M2 (Extensibilidad), M3 (Config), M4 (Template)

---

## 1. Visión Arquitectónica

El Módulo 5 añade la capa de "Operational Excellence" al template. No modifica la lógica de negocio (M1-M3), sino que envuelve la ejecución para garantizar que el sistema sea auditable, seguro y eficiente en producción. Se implementa siguiendo la arquitectura Hexagonal, utilizando Puertos en la capa de Aplicación y Adaptadores en Infraestructura.

### Principios
*   **Observabilidad sin Intrusión:** La auditoría no debe bloquear ni fallar transacciones de negocio críticas (fail-safe).
*   **Seguridad por Defecto:** El template viene "hardened" de caja.
*   **Performance Consciente:** Reglas explícitas para evitar degradación.
*   **Privacy-First:** Minimización de PII en logs.

---

## 2. Auditoría (Audit Logging)

### Contrato (Port)
Se define en `src/modules/booking/application/ports/audit.repository.ts`:

```typescript
export interface IAuditRepository {
    log(event: AuditEvent): Promise<void>;
    logBatch(events: AuditEvent[]): Promise<void>; // Para alto volumen
}
```

### Esquema de Datos (`audit_logs`)
Tabla en Supabase (particionable por fecha conceptualmente):

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | UUID | PK |
| `timestamp_utc` | TIMESTAMPTZ | Cuándo ocurrió (Server Time) |
| `actor_type` | TEXT | SYSTEM, USER, GUEST, ADMIN |
| `actor_id_hash` | TEXT | Hash del ID del actor (si es externo) para correlación sin PII directa |
| `action` | TEXT | Verbo del evento (ej: `BOOKING_CREATED`, `POLICY_DENIED`) |
| `entity_type` | TEXT | BOOKING, CONFIG, FEATURE_FLAG |
| `entity_id` | TEXT/UUID | ID de la entidad afectada |
| `severity` | TEXT | INFO, WARN, ERROR, CRITICAL |
| `metadata` | JSONB | Contexto rico (motivo de rechazo, diff de config, trace_id) |
| `request_id` | TEXT | ID de traza para cruzar con logs de infraestructura |

### Eventos Clave a Registrar

1.  **Decisiones de Negocio (M2):**
    *   `POLICY_DENIED`: Crítico para entender por qué se rechazan reservas. Metadata: `{ policy_id, reason_code, input_params }`.
    *   `POLICY_OVERRIDDEN`: Si se implementan "force" flags.

2.  **Ciclo de Vida (M1):**
    *   `BOOKING_HELD`: Éxito en creación de hold.
    *   `BOOKING_CONFIRMED`: Transición a firme.
    *   `BOOKING_CANCELLED`: Incluye `reason` en metadata.

3.  **Configuración (M3):**
    *   `CONFIG_LOADED`: Al iniciar o recargar. Metadata: `{ source: 'DB|FILE', version }`.
    *   `CONFIG_VALIDATION_ERROR`: Intentos fallidos de carga.

4.  **Seguridad:**
    *   `ADMIN_BLOCK_CREATED`: Auditoría de bloqueos manuales.

### Retención (Política Conceptual)
*   **Hot Storage (DB):** 3 meses (para soporte inmediato).
*   **Cold Storage (Dump):** 1 año (compliance legal).
*   **Cleanup:** Cron job en Supabase vía `pg_cron` (template script provided).

---

## 3. Performance & Anti-waste

### Reglas de Diseño (Checklist)

1.  **Anti-Exhaustion (N+1):**
    *   ❌ Prohibido iterar `bookings` y hacer queries por cada uno.
    *   ✅ Usar `WHERE IN (...)` o Joins.
    *   **Enforce:** Linter rule o revisión de PR obligatoria.

2.  **Config Caching (M3 Refuerzo):**
    *   `ConfigService` debe ser Singleton en memoria.
    *   `getActiveConfig` DB call solo ocurre en `load()` o `reload()`, NUNCA por request individual.

3.  **Supabase Query Optimization:**
    *   Evitar `select *`. Seleccionar campos explícitos.
    *   Uso estricto de índices en `bookings(period, resource_id)`.
    *   **Paginación:** Obligatoria en endpoints de listado (`limit`, `offset/cursor`).

4.  **Rate Limiting (Hardening):**
    *   A nivel Edge/Gateway (fuera de app code, pero documentado).
    *   App Level Protection: `LeakyBucket` conceptual para `CREATE_HOLD` por IP/Actor.

### Golden Signals (Métricas Conceptuales)

*   **Latencia:**
    *   `CreateHold`: Objetivo < 200ms (p95).
    *   `PolicyCheck`: Objetivo < 10ms (in-memory).
*   **Tráfico:**
    *   `Holds/min`: Detección de picos (ataques o viralidad).
*   **Errores:**
    *   `Target`: < 0.1% de errores 5xx.
    *   `PolicyDenied`: Monitorizar ratio. Si > 80%, puede indicar UX confusa o ataque.
*   **Saturación:**
    *   Conexiones DB pool.

---

## 4. Observabilidad Mínima

### Logging Estructurado
Todo log debe ser JSON para ser ingestado por herramientas modernas.

**Formato:**
```json
{
  "level": "info",
  "ts": "2026-01-30T10:00:00Z",
  "msg": "Booking created",
  "correlation_id": "req-123-abc",
  "module": "booking",
  "context": {
    "booking_id": "uuid",
    "resource_id": "uuid"
  }
}
```

### Health Checks
Endpoint: `/health`
*   **Liveness:** Responde 200 OK (App running).
*   **Readiness:**
    *   DB Connection check (simple ping).
    *   Config loaded check (`ConfigService.isLoaded`).

---

## 5. Seguridad & Hardening

### Checklist de Amenazas y Mitigaciones

| Amenaza | Mitigación |
| :--- | :--- |
| **Spam Holds** | Rate Limiting por IP + Expiración agresiva de holds impagos (scheduler). |
| **Policy Bypass** | M1 garantiza estado consistente y M2 se ejecuta siempre antes de persistir. |
| **Config Injection** | Validación estricta Zod en M3. Fail-fast start. |
| **Data Leaks** | RLS estricto en todas las tablas. `audit_logs` no visible para `anon`. |

### Hardening de Infraestructura
*   **Env Vars:**
    *   `SERVICE_ROLE_KEY`: Solo en Server-side environment.
    *   No prefijar vars sensibles con `NEXT_PUBLIC_` (si se usara Next.js) o exponerlas al cliente.
*   **RLS (Row Level Security):**
    *   Auditoría técnica mandatoria: Toda tabla nueva en `custom/` DEBE tener RLS activado.

---

## 6. Validación Final (Release Gate)

Criterios para considerar una instancia del template "Lista para Producción".

### A. Test Suite Mínima
Ejecutar `npm test:all`. Debe incluir:
1.  **Unit:** `PolicyEngine` lógica pura.
2.  **Integration:** `BookingService` persistiendo en DB (Test containers o DB aislada).
3.  **Config:** Carga y fallback correctos.

### B. Pruebas End-to-End Conceptuales (Manual/Scripted)
1.  **Flujo Feliz:** Create Hold -> Wait -> Confirm.
2.  **Flujo Conflicto:** Create Hold (User A) -> Create Hold (User B, same slot) -> **Debe fallar (OverlapError)**.
3.  **Flujo Policy:** Intentar reservar con `LeadTime < Configured` -> **Debe fallar (PolicyDenied)**.
4.  **Flujo Expiración:** Create Hold -> Wait expiration -> Status cambia (simulado o trigger) -> Slot libre.

### C. Smoke Test de Carga
*   Script: Generar 100 holds concurrentes.
*   Expectativa: 0 in-consistencias (overlap). El DB Constraint `EXCLUDE` debe aguantar la concurrencia.

---

## 7. Documentación Final del Template

Archivos a incluir en `docs/` del template para cubrir M5:

### `SECURITY.md`
*   Política de reporte de vulnerabilidades.
*   Explicación de RLS y auth model.
*   Guía de rotación de claves.

### `OPERATIONS.md`
*   Cómo interpretar los Audit Logs.
*   Qué hacer si `health` falla.
*   Procedimiento de Disaster Recovery (Restore DB + Re-seed Config).
*   Playbook de incidentes comunes (ej. "Sistema bloqueando todo por config errónea").

### `PERFORMANCE.md`
*   Guía de índices SQL.
*   Reglas para escribir custom projections.
*   Límites teóricos del sistema (ej. slots por recurso).

### `AUDIT.md`
*   Diccionario de eventos.
*   Significado de metadatos.

---

## 8. Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
| :--- | :--- | :--- |
| **Audit Log Overflow** | Tabla crece infinito, llena disco. | Partitioning por mes o script de retención (`delete < 3 months`). |
| **Performance Overhead** | Logs síncronos ralentizan requests. | Usar `void` promises o colas asíncronas para escribir logs (Fire & Forget controlado). |
| **Alert Fatigue** | Demasiados logs de `PolicyDenied`. | Monitorizar ratios, no eventos individuales. Filtrar niveles de severidad. |
