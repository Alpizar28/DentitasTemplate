# Módulo 3: Configuration Service - Implementación Completa

**Estado:** ✅ Implementado  
**Fecha:** 2026-01-29  
**Módulos Relacionados:** M2 (Extensibilidad)

---

## 📦 Entregables

### Archivos Creados

#### **Application Layer (Ports & Contracts)**
```
src/modules/booking/application/configuration/
├── config.types.ts          # BookingConfig interface, validation, defaults
├── config.ports.ts          # IConfigRepository, IConfigService (ports)
└── config.service.ts        # ConfigService implementation (merge, validation, cache)
```

#### **Infrastructure Layer (Adapters)**
```
src/modules/booking/infrastructure/configuration/
├── supabase-config.repository.ts  # Supabase adapter for app_config table
└── config-seed.script.ts          # Idempotent seed script
```

#### **Database**
```
supabase/migrations/
└── 20260130005905_config_module.sql  # app_config table DDL
```

#### **Seeds & Tests**
```
seeds/
└── base-config.json                  # Base configuration with safe defaults

src/modules/booking/tests/
├── config.service.spec.ts            # ConfigService unit tests
└── policy.registry.spec.ts           # PolicyRegistry integration tests
```

#### **Modified Files**
- ✏️ `src/modules/booking/application/extensions/policy.registry.ts` - Now consumes ConfigService
- ✏️ `package.json` - Added `test:config` and `seed:config` scripts

---

## 🏗️ Arquitectura: Application vs Infrastructure

```
┌────────────────────────────────────────────────────────────────┐
│                      MODULE 2 (Extensibility)                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ PolicyRegistry (M3-aware)                                │  │
│  │ - Reads flags via IConfigService.isEnabled()             │  │
│  │ - Reads params via IConfigService.getPolicyParams()      │  │
│  │ - Instantiates LeadTimePolicy(minMinutes)                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│                             ▼                                   │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│             MODULE 3 APPLICATION (Ports & Logic)               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ IConfigService (Port)                                    │  │
│  │ - getConfig(): BookingConfig                             │  │
│  │ - getPolicyParams<T>(name): T                            │  │
│  │ - isEnabled(flag): boolean  [implements IFeatureFlagProvider] │
│  │ - load(): Promise<void>                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│                             ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ConfigService (Implementation)                           │  │
│  │ - Merge logic: Env > DB > File > Defaults                │  │
│  │ - Validation: validateConfig() [fail-fast]               │  │
│  │ - Cache: currentConfig (loaded on boot)                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│                   uses IConfigRepository                        │
│                             │                                   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│             MODULE 3 INFRASTRUCTURE (Adapters)                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ SupabaseConfigRepository (Adapter)                       │  │
│  │ - getActiveConfig(env): BookingConfig | null             │  │
│  │ - upsertConfig(key, env, config): Promise<void>          │  │
│  │ - Queries: app_config table (JSONB)                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│                             ▼                                   │
│               ┌─────────────────────────┐                       │
│               │  Supabase (app_config)  │                       │
│               └─────────────────────────┘                       │
└────────────────────────────────────────────────────────────────┘
```

**Principios Clave:**
- ✅ **M2 no conoce Supabase:** Solo usa `IConfigService` (port).
- ✅ **Policies puras:** No leen `process.env` ni DB; reciben params en constructor.
- ✅ **Inversión de Dependencias:** Application define ports, Infrastructure implementa adapters.

---

## 🔧 Contratos (Ports)

### `IConfigService`
```typescript
interface IConfigService extends IFeatureFlagProvider {
    getConfig(): BookingConfig;
    getPolicyParams<T = any>(policyName: string): T;
    load(): Promise<void>;
}
```

### `IConfigRepository`
```typescript
interface IConfigRepository {
    getActiveConfig(environment: string): Promise<BookingConfig | null>;
    upsertConfig(key: string, environment: string, config: BookingConfig): Promise<void>;
}
```

---

## 🎯 Merge Strategy (Precedence Order)

**Highest Priority → Lowest Priority:**

1️⃣ **Environment Variables** (Emergency flags only)  
   - Scope: Feature flags para deshabilitar policies urgentemente  
   - Example: `BOOKING_EMERGENCY_DISABLE_LEAD_TIME=true`  
   - Status: Placeholder en código, sin vars mapeadas aún

2️⃣ **Database Config** (`app_config` table)  
   - Active override (`is_active = true`)  
   - Dynamic, can change without redeploying  

3️⃣ **File Config** (`seeds/base-config.json`)  
   - Git-controlled baseline  
   - Safe defaults for all environments  

4️⃣ **Code Defaults** (`DEFAULT_CONFIG` constant)  
   - Last resort safety net  
   - Guarantees app can start even if all sources fail

**Merge Algorithm:** Deep merge for objects (policies, featureFlags), last-write-wins for primitives.

---

## 🚨 Flags de Emergencia (Env Vars)

### Soporte Actual
- **Scope limitado:** Solo feature flags (no params de policies vía env).
- **Método:** `loadEnvFlags()` en `ConfigService` (actualmente retorna `{}`).

### Flags Propuestos (No implementados aún)
```bash
# Emergency kill switches
BOOKING_EMERGENCY_DISABLE_ALL_POLICIES=true
BOOKING_FORCE_LEAD_TIME_ENABLED=false
BOOKING_FORCE_MAX_ADVANCE_ENABLED=false
```

**Defaults sin env vars:**  
Ver `DEFAULT_FLAG_VALUES` en `feature-flags.interfaces.ts` (M2):
- `booking.policies.lead_time.enabled`: `true`
- `booking.policies.max_advance.enabled`: `true`
- `booking.confirmation.manual.enabled`: `false`
- `booking.admin.block.enabled`: `true`

---

## ✅ Seed Idempotente

### Flujo
```bash
npm run seed:config
```

**Proceso:**
1. Lee `seeds/base-config.json`
2. Valida con `validateConfig()` (fail-fast si inválido)
3. Detecta environment (`NODE_ENV` o `development`)
4. Ejecuta `upsertConfig('DEFAULT', environment, config)`
5. Idempotente via constraint: `UNIQUE (key, environment, is_active)`

**Logging:**
```
[ConfigSeed] Starting configuration seed...
[ConfigSeed] Reading config from: c:/path/seeds/base-config.json
[ConfigSeed] Validating configuration schema...
[ConfigSeed] ✓ Configuration valid. Version: 1.0.0
[ConfigSeed] Target environment: development
[ConfigSeed] Upserting configuration to database...
[ConfigSeed] ✓ Configuration seeded successfully!
```

---

## 🧪 Pruebas

### Unit Tests: `config.service.spec.ts`
- ✅ Merge precedence: DB > File > Defaults
- ✅ Validation fail-fast (invalid config → throws)
- ✅ Feature flag resolution con fallback a M2 defaults
- ✅ Policy params mapping

### Integration Tests: `policy.registry.spec.ts`
- ✅ PolicyRegistry instancia policies con params de ConfigService
- ✅ Feature flags controlan qué policies se activan
- ✅ Safe defaults cuando config está vacía

**Ejecutar:**
```bash
npm run test:config
```

**Sin DB real:** Se usan `FakeConfigRepository` y `FakeConfigService` para unit tests.

---

## 📋 Checklist de Validación Final

### ✅ Cambiar minLeadTime sin recompilar
**Pasos:**
1. Editar `seeds/base-config.json`: `"minMinutes": 120`
2. Ejecutar `npm run seed:config`
3. Reiniciar app (o llamar `configService.load()`)
4. ✅ PolicyRegistry instancia `LeadTimePolicy(120)`

---

### ✅ Borrar DB override y caer a file
**Pasos:**
1. `DELETE FROM app_config WHERE environment = 'development';`
2. `configService.load()` → retorna null de DB
3. ✅ Fallback a `base-config.json` (60 min default)

---

### ✅ Config inválida bloquea arranque
**Test:**
```typescript
validateConfig({ invalid: 'structure' }); // ❌ Throws ConfigValidationError
```
**Comportamiento:**
- Si `load()` falla → `throw error` (fail-fast)
- App NO arranca con config corrupta

---

### ✅ Policies siguen puras
**Validado:**
- ✅ `LeadTimePolicy` no importa `ConfigService`
- ✅ `MaxAdvanceBookingPolicy` no lee `process.env`
- ✅ Solo reciben params vía constructor: `new LeadTimePolicy(60)`

---

## 🔒 Restricciones Cumplidas

- ✅ **NO se tocó M1:** Core domain intacto
- ✅ **NO UI:** Solo código backend
- ✅ **NO pagos/notifs:** Fuera de scope
- ✅ **NO multi-tenant:** Configuración por `environment`, no por tenant
- ✅ **NO scheduler real:** Solo método `reload()` sin webhook

---

## 🚀 Próximos Pasos (Fuera de Scope M3)

1. **Implementar env vars reales:** Mapear `BOOKING_EMERGENCY_*` en `loadEnvFlags()`
2. **Admin UI para editar config:** CRUD sobre `app_config` table
3. **Webhook de recarga:** POST `/api/admin/config/reload` → `configService.load()`
4. **Versionado estricto:** Migración automática de config v1.0 → v2.0
5. **Audit log:** Rastrear cambios a `app_config` (quien/cuando/qué)

---

## 📖 Resumen Ejecutivo

**Módulo 3 transforma BellBooking de estático a dinámico.**

- **Antes (M2):** `new LeadTimePolicy(60)` hardcoded en código.
- **Ahora (M3):** `new LeadTimePolicy(configService.getPolicyParams().minMinutes)`.

**Capacidades Desbloqueadas:**
- Cambiar reglas de negocio editando JSON (sin redeploy)
- Overrides de DB para tuning en producción
- Kill switches de emergencia vía env vars
- Seed idempotente para bootstrap de nuevos entornos
- Validación estricta que previene configs inválidas

**Separación de Responsabilidades:**
- **M1:** Core domain (agnóstico)
- **M2:** Extensibility (policies puras + registry)
- **M3:** Configuration (inyecta comportamiento en M2)

**Arquitectura:**
- Hexagonal/Ports & Adapters estricta
- M2 depende de ports (`IConfigService`), NO de adapters (`SupabaseConfigRepository`)
- Tests sin DB real (fakes/mocks)

🎯 **Objetivo Cumplido:** Configuración dinámica, validada, y desacoplada.
