# Módulo 3: Configuration & Seed Design

> **Status:** IMPLEMENTED
> **Module:** `src/modules/booking/application/configuration`
> **Infrastructure:** `src/modules/booking/infrastructure/configuration`
> **Dependencies:** None (Base Module)

Este documento especifica el diseño técnico del Sistema de Configuración y Sembrado (Seed). Su objetivo es desacoplar el código de los valores configuración (Feature Flags, Policies, Schedules) y permitir la gestión por entornos (Dev, Test, Prod).

---

## 1. Principios de Diseño
1.  **Config as Code + DB Override**: La configuración nace en código (`base-config.json`) para control de versiones, pero se carga en BD (`app_config`) para permitir cambios en tiempo de ejecución ("Hot Reload" o Admin UI).
2.  **Strict Environment Separation**: Cada entorno (`development`, `production`) tiene su propia configuración aislada.
3.  **Fail-Fast in Production**: Si la configuración crítica falta en Producción, la aplicación debe fallar al iniciar en lugar de usar defaults inseguros.
4.  **Typed Configuration**: Todo JSON debe ser validado contra interfaces TypeScript (`BookingConfig`, `ScheduleConfig`) antes de ser usado.

---

## 2. Modelo de Datos (`app_config`)

Tabla PostgreSQL diseñada para flexibilidad (JSONB) y unicidad por entorno.

```sql
CREATE TABLE app_config (
    id uuid PRIMARY KEY,
    key text NOT NULL,        -- 'DEFAULT' (Root config) or specific keys
    environment text NOT NULL, -- 'development', 'production', etc.
    config_json jsonb NOT NULL,
    is_active boolean DEFAULT true,
    version text,
    CONSTRAINT unique_active_config UNIQUE (key, environment, is_active)
);
```

---

## 3. Arquitectura del Servicio (`ConfigService`)

El servicio sigue una estrategia de capas ("Onion Loading"):

1.  **Capa 0 (Hardcoded Defaults):** Valores constantes en código (Solo para tests unitarios o bootstrap).
2.  **Capa 1 (File Base):** Carga `seeds/base-config.json`. Contiene la estructura completa base.
3.  **Capa 2 (DB Override):** Consulta `app_config` filtrando por `NODE_ENV`. Si existe, hace **Deep Merge** sobre la Capa 1.
4.  **Capa 3 (Env Vars):** Variables de entorno (`process.env`) tienen la máxima prioridad para "Kill Switches" o credenciales.

### Interfaces Clave

*   `IConfigRepository`: Abstracción para leer de BD (Supabase).
*   `IFeatureFlagProvider`: Interfaz para consultar flags (`isEnabled`).
*   `SmartAvailabilityService`: Consume `ScheduleConfig` validado.

---

## 4. Estrategia de Seeding (Módulo 3 Core)

No insertamos datos "dummy" descontrolados. El proceso de Seed es formal:

*   **Script:** `npm run seed:config:dev` (o `:prod`)
*   **Fuente:** `seeds/base-config.json`
*   **Validación:** Antes de insertar, el script valida el JSON con `validateConfig()` (checks de estructura, arrays, timezone).
*   **Idempotencia:** Usa `UPSERT` en la base de datos. Si la config ya existe para ese entorno, la actualiza; si no, la crea.

### Uso
```bash
# Desarrollo
npm run seed:config:dev

# Producción (CI/CD)
npm run seed:config:prod
```

---

## 5. Security & Safety

*   **Strict Mode (PolicyRegistry & Availability):** Componentes críticos verifican `NODE_ENV`. Si es `production` y `configService` devuelve `null` o incompleto, lanzan Excepción Crítica.
*   **Type Safety:** `config.types.ts` exporta interfaces (`BookingConfig`, `ScheduleConfig`, `ServiceConfig`) utilizadas en todo el sistema.
