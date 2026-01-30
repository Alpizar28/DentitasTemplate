# Módulo 4: Template Repo & Project Scaffolding

**Estado:** Diseño Propuesto  
**Fecha:** 2026-01-29  
**Dependencias:** M1 (Core), M2 (Extensibilidad), M3 (Config)

---

## 1. Visión y Responsabilidades

### Propósito
El Módulo 4 NO es código ejecutable. Es la **infraestructura de replicación** que permite crear proyectos BellBooking nuevos de forma segura, rápida y mantenible.

### Responsabilidades Clave
1. **Definir estructura canónica** del repositorio template
2. **Establecer boundaries** entre Core (intocable) y Custom (seguro)
3. **Proveer proceso de scaffolding** repetible para nuevos proyectos
4. **Gestionar configuración multi-entorno** (dev/staging/prod)
5. **Habilitar evolución del template** sin romper proyectos existentes
6. **Documentar reglas de customización** para prevenir errores

### Principios Arquitectónicos
- **El Core no se edita, se configura**: M1-M3 son black box
- **Un Cliente = Un Repo**: NO multi-tenant, NO monorepo compartido
- **Opinionated, no genérico**: Estructura rígida que previene caos
- **Diff-friendly**: Cambios al template deben ser portables vía Git

---

## 2. Estructura del Repositorio Template

### Árbol de Carpetas Canónico

```
BellBooking-Template/
│
├── src/
│   ├── modules/
│   │   ├── booking/              [CORE - INTOCABLE]
│   │   │   ├── domain/           # M1: Entities, VOs, FSM
│   │   │   ├── application/      # M2: Policies, PolicyEngine, Config (M3)
│   │   │   ├── infrastructure/   # Adapters Supabase, Repositories
│   │   │   └── tests/            # Tests unitarios core
│   │   │
│   │   └── custom/               [CUSTOM - SEGURO EXTENDER]
│   │       ├── policies/         # Policies adicionales del cliente
│   │       ├── adapters/         # Integraciones custom (analytics, logs)
│   │       ├── projections/      # Vistas/queries custom
│   │       └── workflows/        # Orquestación específica cliente
│   │
│   ├── shared/                   [UTILIDADES - EXTENDER CON CUIDADO]
│   │   ├── domain/               # Ports genéricos (IClock, ILogger)
│   │   ├── infrastructure/       # Clients (Supabase, Email futuro)
│   │   └── config/               # Runtime config loader
│   │
│   └── api/                      [FRAMEWORK - CUSTOMIZABLE]
│       ├── routes/               # Endpoints REST/GraphQL
│       ├── middleware/           # Auth, CORS, Rate Limiting
│       └── handlers/             # Controllers/Resolvers
│
├── seeds/                        [DATA - CUSTOMIZABLE POR ENTORNO]
│   ├── base-config.json          # Config DEFAULT (editable)
│   ├── resources.json            # Recursos iniciales cliente
│   └── availability-rules.json   # Horarios base
│
├── supabase/                     [DB - CORE MIGRATIONS INTOCABLE]
│   ├── migrations/
│   │   ├── 202601300059XX_*.sql  # M1-M3 migrations [CORE]
│   │   └── 202602XXXXXX_*.sql    # Custom migrations [CLIENTE]
│   └── config.toml               # Supabase project settings
│
├── scripts/                      [AUTOMATION - TEMPLATE PROVISTO]
│   ├── bootstrap.sh              # Setup inicial proyecto
│   ├── seed-all.sh               # Ejecutar seeds idempotentes
│   ├── deploy-staging.sh         # Deploy a staging
│   └── migrate-template.sh       # Actualizar desde template
│
├── docs/                         [DOCS - OBLIGATORIAS]
│   ├── README.md                 # Quickstart
│   ├── ARCHITECTURE.md           # M1-M4 explicado
│   ├── CONFIG.md                 # Guía de configuración
│   ├── CUSTOMIZATION.md          # Qué sí/no tocar
│   └── CHANGELOG.md              # Versionado del template
│
├── .env.example                  [ENV - CUSTOMIZABLE]
├── .env.development
├── .env.staging
├── .env.production
│
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

### Carpetas: Clasificación y Reglas

| Carpeta | Status | ¿Tocar? | ¿Extender? | Notas |
|---------|--------|---------|------------|-------|
| `src/modules/booking/` | **CORE** | ❌ NO | ❌ NO | M1-M3 frozen. Solo se configura vía JSON. |
| `src/modules/custom/` | **CUSTOM** | ✅ SÍ | ✅ SÍ | Espacio exclusivo del cliente. |
| `src/shared/domain/` | **UTILS** | ⚠️ CUIDADO | ✅ SÍ | Agregar ports genéricos OK. No modificar existentes. |
| `src/shared/infrastructure/` | **ADAPTERS** | ⚠️ CUIDADO | ✅ SÍ | Nuevos clients OK (ej. Logger). No romper Supabase client. |
| `src/api/` | **FRAMEWORK** | ✅ SÍ | ✅ SÍ | Endpoints, auth, middleware custom. |
| `seeds/` | **DATA** | ✅ SÍ | ✅ SÍ | Configuración y datos base del cliente. |
| `supabase/migrations/` (Core) | **CORE DDL** | ❌ NO | ❌ NO | Migrations `202601300059XX_*` intocables. |
| `supabase/migrations/` (Custom) | **CUSTOM DDL** | ✅ SÍ | ✅ SÍ | Migrations `202602XXXXXX_*` para tablas custom. |
| `scripts/` | **TOOLING** | ✅ SÍ | ✅ SÍ | Agregar scripts custom OK. |
| `docs/` | **DOCS** | ✅ SÍ | ✅ SÍ | Documentar custom features obligatorio. |

---

## 3. Boundary: Core vs Custom

### Qué SÍ Puede Customizar un Cliente

#### ✅ Agregar Policies Custom
**Dónde:** `src/modules/custom/policies/`

**Ejemplo:** `VIPClientPolicy`, `SeasonalPricingPolicy`

**Mecanismo:**
1. Implementar `IPolicy` de M2
2. Registrar en `custom/policy.extensions.ts`
3. Configurar params en `seeds/base-config.json` bajo `policies.VIPClientPolicy`
4. Feature flag: `custom.policies.vip_enabled`

**Regla:** La policy NO debe modificar FSM ni leer DB directamente (usar puertos).

---

#### ✅ Agregar Feature Flags Custom
**Dónde:** `src/modules/custom/feature-flags.ts`

**Ejemplo:**
```typescript
export const CustomFlags = {
  INTEGRATIONS: {
    WHATSAPP_ENABLED: 'custom.integrations.whatsapp.enabled',
    ANALYTICS_TRACKING: 'custom.analytics.tracking.enabled'
  }
}
```

**Mecanismo:**
1. Definir constantes en archivo custom
2. Agregar defaults en `custom/feature-flag-defaults.ts`
3. ConfigService los resuelve igual que flags core

---

#### ✅ Agregar Adapters Custom
**Dónde:** `src/modules/custom/adapters/`

**Ejemplos:**
- `analytics.adapter.ts`: Enviar eventos a analytics externo
- `notification.adapter.ts`: WhatsApp, SMS
- `audit-log.adapter.ts`: Rastreo de cambios

**Regla:** Deben implementar ports de `shared/domain/` (ej. `INotificationService`).

---

#### ✅ Crear Projections/Queries Custom
**Dónde:** `src/modules/custom/projections/`

**Ejemplo:** Dashboard analytics, reportes custom

**Mecanismo:**
1. Leer desde `bookings` table (read-only)
2. Agregar vistas SQL si necesario (`supabase/migrations/202602XXXXXX_custom_views.sql`)
3. NO modificar estructura de tablas core

---

#### ✅ Modificar Seeds
**Dónde:** `seeds/*.json`

**Qué cambiar:**
- `base-config.json`: Ajustar params de policies core
- `resources.json`: Definir recursos del cliente (ej. "Sala 1", "Cancha A")
- `availability-rules.json`: Horarios operativos

**Validación:** El seed script valida schema antes de aplicar.

---

#### ✅ Extender API/Endpoints
**Dónde:** `src/api/routes/custom/`

**Ejemplos:**
- `POST /api/custom/analytics/report`
- `GET /api/custom/availability/calendar`

**Regla:** NO exponer endpoints que mutaten `bookings` directamente sin pasar por PolicyEngine.

---

### Qué NO Puede Tocar un Cliente

#### ❌ FSM de Bookings (M1)
**Archivo:** `src/modules/booking/domain/entities/booking.entity.ts`

**Prohibido:**
- Agregar estados custom al enum `booking_status`
- Modificar transiciones permitidas
- Cambiar validaciones de `Booking.confirm()`

**Razón:** Rompe invariantes críticos del core.

---

#### ❌ EXCLUDE Constraint (M1)
**Archivo:** `supabase/migrations/20260130005904_booking_constraints.sql`

**Prohibido:**
- Modificar lógica de `no_overlap_in_active_bookings`
- Cambiar qué estados ocupan slots

**Razón:** Núcleo anti-overbooking. Cambios aquí invalidan todo el sistema.

---

#### ❌ PolicyEngine (M2)
**Archivo:** `src/modules/booking/application/services/policy-engine.service.ts`

**Prohibido:**
- Modificar orden de evaluación
- Cambiar lógica de short-circuit
- Agregar efectos secundarios

**Regla:** Si necesitas lógica custom, crea una Policy nueva, NO toques el Engine.

---

#### ❌ ConfigService (M3)
**Archivo:** `src/modules/booking/application/configuration/config.service.ts`

**Prohibido:**
- Cambiar orden de merge (Env > DB > File > Defaults)
- Remover validación

**Razón:** Garantiza fail-fast y predictibilidad.

---

#### ❌ Migrations Core (M1-M3)
**Archivos:** `supabase/migrations/202601300059XX_*.sql`

**Prohibido:**
- Editar migrations existentes
- `ALTER TABLE bookings` para agregar columnas (usar `metadata` JSONB)

**Excepción:** Agregar índices de performance es aceptable si no cambian constraints.

---

### Gray Zone (Extender con Precaución)

#### ⚠️ Agregar Ports en `shared/domain/`
**Ejemplo:** `IPaymentGateway`, `IEmailService`

**Permitido si:**
- Es genérico (no acoplado a lógica de negocio específica)
- Tiene múltiples implementaciones posibles
- Se documenta en `CUSTOMIZATION.md`

**NO permitido:**
- Ports que rompen abstracciones (ej. `ISupabaseDirectAccess`)

---

#### ⚠️ Modificar `PolicyRegistry`
**Archivo:** `src/modules/booking/application/extensions/policy.registry.ts`

**Permitido:**
- Agregar instanciación de policies custom al final de `getActivePolicies()`

**NO permitido:**
- Cambiar orden de policies core
- Remover policies existentes

**Mejor práctica:** Crear `custom/policy.registry.extension.ts` y componerlo.

---

## 4. Proceso de Scaffolding (Nuevo Proyecto)

### Flujo Paso a Paso

#### Paso 1: Clonar Template
```bash
git clone https://github.com/bellbooking/bellbooking-template.git nuevo-cliente
cd nuevo-cliente
rm -rf .git  # Romper vínculo con template
git init     # Nuevo repo independiente
```

**Duración:** 1 min

---

#### Paso 2: Renombrar Proyecto
```bash
./scripts/bootstrap.sh --project-name "Cliente ABC" --slug "cliente-abc"
```

**Qué hace:**
- Busca/reemplaza "BellBooking-Template" → "Cliente ABC" en:
  - `package.json` (name, description)
  - `README.md`
  - `ARCHITECTURE.md`
- Actualiza `.env.example` con prefijo `CLIENTE_ABC_`
- Genera `PROJECT_ID.txt` con UUID único para tracking

**Duración:** 2 min

---

#### Paso 3: Configurar Entorno Local
```bash
cp .env.example .env.development
# Editar .env.development:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - NODE_ENV=development
```

**Variables mínimas obligatorias:**
- `SUPABASE_URL` (del proyecto Supabase creado)
- `SUPABASE_ANON_KEY`
- `NODE_ENV` (development/staging/production)

**Duración:** 3 min

---

#### Paso 4: Ejecutar Migrations
```bash
npx supabase db push
```

**Qué aplica:**
- Migrations M1 (Core DDL)
- Migrations M2-M3 (Constraints, app_config table)
- Migrations custom (si ya existen, si no, vacío)

**Validación:**
- `bookings` table existe con EXCLUDE constraint
- `app_config` table existe

**Duración:** 2 min

---

#### Paso 5: Seed Configuración Base
```bash
npm run seed:config
```

**Qué hace:**
- Lee `seeds/base-config.json`
- Valida schema
- Upsert a `app_config` (key: DEFAULT, env: development)

**Validación:**
- Query: `SELECT * FROM app_config WHERE environment = 'development'`
- Debe retornar 1 fila con config válida

**Duración:** 1 min

---

#### Paso 6: Seed Recursos Iniciales (Opcional)
```bash
npm run seed:resources
```

**Qué hace:**
- Lee `seeds/resources.json`
- Inserta en tabla `resources`

**Ejemplo `resources.json`:**
```json
[
  { "name": "Sala Principal", "category": "rooms" },
  { "name": "Cancha 1", "category": "sports" }
]
```

**Duración:** 1 min

---

#### Paso 7: Verificar Boot
```bash
npm run dev
```

**Validaciones automáticas al arrancar:**
1. ConfigService carga configuración sin errores
2. PolicyRegistry instancia policies activas
3. Servidor HTTP responde en puerto configurado

**Endpoint de salud:**
```
GET /api/health
Response: { "status": "ok", "config_loaded": true, "policies": 2 }
```

**Duración:** 2 min

---

#### Paso 8: Commit Initial
```bash
git add .
git commit -m "chore: initial scaffold from BellBooking Template v1.0.0"
git remote add origin <repo-cliente>
git push -u origin main
```

**Duración:** 2 min

---

### Total: < 15 minutos de setup técnico

**Documentación incluida en template:**
- `docs/QUICKSTART.md`: Este proceso paso a paso
- `docs/TROUBLESHOOTING.md`: Errores comunes (missing env vars, seed fail)

---

## 5. Gestión de Entornos

### Convención de Entornos

| Entorno | `NODE_ENV` | Supabase Project | Config Key | Protecciones |
|---------|-----------|------------------|------------|--------------|
| **Development** | `development` | `proyecto-dev` | `DEFAULT` | Seed rápido OK. Datos volátiles. |
| **Staging** | `staging` | `proyecto-staging` | `STAGING` | Seed con datos realistas. Permite reset. |
| **Production** | `production` | `proyecto-prod` | `PRODUCTION` | Seed protegido (requiere `--force`). NO reset. |

---

### Configuración por Entorno

#### Variables de Entorno (`.env.*`)
```bash
# .env.development
NODE_ENV=development
SUPABASE_URL=https://xyz-dev.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
LOG_LEVEL=debug

# .env.production
NODE_ENV=production
SUPABASE_URL=https://xyz-prod.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
LOG_LEVEL=error
BOOKING_EMERGENCY_DISABLE_ALL_POLICIES=false  # Kill switch
```

---

#### Seeds por Entorno
**Estructura:**
```
seeds/
├── base-config.json              # Compartido (defaults)
├── base-config.staging.json      # Overrides staging
├── base-config.production.json   # Overrides prod
└── resources.production.json     # Recursos reales prod
```

**Lógica de carga:**
1. Leer `base-config.json`
2. Si existe `base-config.{NODE_ENV}.json`, hacer merge
3. Validar resultado final
4. Upsert con key según environment

---

#### Flags de Emergencia por Entorno
**Solo Production:**
```bash
BOOKING_EMERGENCY_DISABLE_ALL_POLICIES=true
```

**Efecto:**
- `ConfigService.loadEnvFlags()` fuerza todos los flags a `false`
- PolicyRegistry retorna `[]` (policies inactivas)
- Sistema permite bookings sin validaciones (uso EXTREMO)

**Uso:**
- Incidente crítico: Constraint DB roto, sistema atorado
- Deshabilitar validaciones temporalmente para recuperar operación
- Requiere aprobación de arquitecto

---

### Protecciones Anti-Error

#### Seed en Production
```bash
npm run seed:config -- --env production
# Prompt: "WARNING: You are seeding PRODUCTION. Type project name to confirm:"
# User: "Cliente ABC"
# Proceed...
```

**Validación:**
- Script verifica `NODE_ENV !== 'test'`
- Requiere confirmación explícita si `production`
- Log a archivo `logs/seed-production-{timestamp}.log`

---

#### Deploy Accidental
**Git Hooks (`.husky/pre-push`):**
```bash
# Si branch actual es 'main' y remote contiene 'production':
# Bloquear push y pedir confirmación
```

**Alternativa:** CI/CD gates que requieren aprobación manual para prod.

---

## 6. Estrategia de Evolución del Template

### Problema
Un proyecto creado hace 6 meses necesita beneficiarse de mejoras al template sin romper customizaciones.

---

### Versionado del Template

#### SemVer Estricto
```
Template v1.2.3
  Major: Cambios incompatibles (ej. renombrar IPolicy interface)
  Minor: Features nuevas compatibles (ej. nueva policy core opcional)
  Patch: Bugfixes, docs, performance
```

**Registro:**
- `docs/CHANGELOG.md` en template con formato estructurado
- Cada proyecto hijo incluye `TEMPLATE_VERSION.txt` con versión usada

---

### Proceso de Actualización

#### Paso 1: Detectar Cambios
```bash
./scripts/migrate-template.sh --check-updates
```

**Output:**
```
Current template version: v1.0.0
Latest template version: v1.2.1

Changes:
- v1.1.0 (MINOR): Added CancellationPolicy to core
- v1.2.0 (MINOR): ConfigService supports env var overrides
- v1.2.1 (PATCH): Fixed validation bug

Compatibility: ✅ Safe to migrate (no breaking changes)
```

---

#### Paso 2: Preview Diff
```bash
./scripts/migrate-template.sh --preview
```

**Qué hace:**
1. Pull template branch a `tmp-template/`
2. Diff de archivos core:
   - `src/modules/booking/` (¿cambió?)
   - `docs/` (¿nueva documentación?)
   - `scripts/` (¿scripts mejorados?)
3. Mostrar diff sin aplicar

**Output:**
```diff
+ src/modules/booking/application/policies/time/cancellation.policy.ts
M src/modules/booking/application/configuration/config.service.ts (4 lines)
M docs/ARCHITECTURE.md (docs update)
```

---

#### Paso 3: Aplicar Selectivamente
```bash
./scripts/migrate-template.sh --apply --strategy=merge
```

**Estrategias:**

**A) Merge (Default):**
- Git merge de archivos core
- Conflictos requieren resolución manual
- Customizaciones en `custom/` intactas

**B) Copy-Core-Only:**
- Sobrescribe `src/modules/booking/` completo (solo si no hay customización ahí)
- Preserva TODO lo demás

**C) Manual:**
- Script solo descarga archivos cambiados
- Desarrollador aplica diff manualmente

---

#### Paso 4: Validación Post-Migración
```bash
npm run test:all
npm run verify:config
```

**Checklist automático:**
- ✅ Tests unitarios core pasan
- ✅ ConfigService carga sin errores
- ✅ PolicyRegistry instancia policies
- ✅ Migrations aplicables sin conflicto

---

### Cambios Incompatibles (Breaking Changes)

**Ejemplo:** Template v2.0.0 renombra `IPolicy` → `IBookingRule`

**Proceso:**
1. `CHANGELOG.md` debe documentar:
   - Qué cambió
   - Por qué
   - Guía de migración manual paso a paso
2. Script `migrate-template.sh` detecta breaking change y:
   - Muestra warning rojo
   - Requiere flag `--accept-breaking`
   - Genera backup automático pre-migración
3. Desarrollador:
   - Lee `MIGRATION_GUIDE_v2.md`
   - Actualiza policies custom manualmente
   - Ejecuta tests

**Regla de Oro:** Breaking changes solo en Major versions y con 3+ meses de aviso.

---

### Diff-Friendly Patterns

**Buenas prácticas en template para facilitar merges:**

1. **No hardcodear en medio de código custom:**
   - ❌ Agregar policy core en medio de `PolicyRegistry.getActivePolicies()`
   - ✅ Extension point: `PolicyRegistry.getCoreActivePolicies()` separado

2. **Archivos pequeños y focused:**
   - Cada policy en archivo separado
   - Fácil agregar sin conflictos

3. **Config-driven:**
   - Nuevas features opt-in vía flags
   - Proyectos viejos no se rompen (flag default: false)

4. **Changelog granular:**
   - Commits atómicos en template
   - Tags de versión claros

---

## 7. Documentación Obligatoria

### Archivos Mínimos en Todo Proyecto Generado

#### `README.md`
**Secciones obligatorias:**
- Descripción del proyecto (Cliente X - BellBooking Instance)
- Prerequisitos (Node, Supabase CLI)
- Quickstart (cómo correr local)
- Scripts disponibles (`npm run seed:config`, etc.)
- Estructura de carpetas resumida
- Cómo contribuir (si equipo)

**Audiencia:** Desarrollador nuevo en el proyecto.

---

#### `ARCHITECTURE.md`
**Secciones obligatorias:**
- Resumen de M1-M4
- Diagrama de módulos (textual o Mermaid)
- Decisiones arquitectónicas clave (por qué Hexagonal, por qué EXCLUDE)
- Boundary Core vs Custom
- Puertos y Adapters principales

**Audiencia:** Arquitecto, Tech Lead.

---

#### `CONFIG.md`
**Secciones obligatorias:**
- Cómo funciona ConfigService (merge order)
- Dónde editar config (`seeds/base-config.json`)
- Cómo agregar flags nuevos
- Cómo agregar params de policies custom
- Variables de entorno críticas
- Troubleshooting: "Config no carga", "Seed falla"

**Audiencia:** DevOps, Desarrollador.

---

#### `CUSTOMIZATION.md`
**Secciones obligatorias:**
- **Qué SÍ tocar** (lista completa con ejemplos)
- **Qué NO tocar** (lista con razones claras)
- **Gray Zone** (tocar con precaución)
- Guías paso a paso:
  - Agregar policy custom
  - Agregar adapter custom
  - Agregar endpoint API custom
- Validación: "¿Cómo sé que no rompí el core?"

**Audiencia:** Desarrollador implementando features custom.

---

#### `CHANGELOG.md`
**Secciones obligatorias:**
- Versión del template usada al crear proyecto
- Historial de actualizaciones del template aplicadas
- Cambios custom del cliente (features agregadas)

**Formato:**
```markdown
# Changelog

## Template Updates
- **v1.2.1** (2026-02-15): Applied bugfix to ConfigService
- **v1.0.0** (2026-01-29): Initial scaffold

## Custom Features
- **v0.2.0** (2026-02-10): Added VIPClientPolicy
- **v0.1.0** (2026-01-30): Initial deployment Cliente ABC
```

**Audiencia:** Auditores, Mantenedores futuros.

---

#### `DEPLOYMENT.md`
**Secciones obligatorias:**
- Cómo deployar a staging
- Cómo deployar a producción
- Checklist pre-deploy (migrations, seeds, env vars)
- Rollback procedure
- Monitoring basics (dónde ver logs)

**Audiencia:** DevOps.

---

### Documentación Viva

**Regla:** Si modificas core custom, documenta en `CUSTOMIZATION.md`.

**Validación:** PR checklist incluye:
- [ ] ¿Agregaste policy custom? → Documentado en `CUSTOMIZATION.md`
- [ ] ¿Cambiaste seed? → Documentado en `CONFIG.md`

---

## 8. Checklist de Validación del Template

### ✅ Crear Nuevo Proyecto en < 30 min

**Pasos automatizados:**
1. Clonar template (1 min)
2. Renombrar con script (2 min)
3. Config env vars (3 min)
4. Migrations (2 min)
5. Seed config (1 min)
6. Seed resources (1 min)
7. Boot verificación (2 min)
8. Commit inicial (2 min)
9. Leer docs (10 min)
10. Deploy staging (5 min)

**Total:** ~30 min

**Criterio:** Un desarrollador mid-level puede hacerlo sin ayuda.

---

### ✅ No Tocar Core para Customizar

**Casos de uso:**

**Caso 1:** Cliente necesita policy "Solo VIPs pueden reservar fines de semana"
- ❌ NO editar `src/modules/booking/application/policies/`
- ✅ SÍ crear `src/modules/custom/policies/weekend-vip.policy.ts`
- ✅ SÍ configurar en `seeds/base-config.json`

**Caso 2:** Cliente necesita enviar SMS al confirmar
- ❌ NO editar `BookingService.confirmBooking()`
- ✅ SÍ crear `src/modules/custom/adapters/sms-notification.adapter.ts`
- ✅ SÍ orquestar en `src/modules/custom/workflows/confirmation-workflow.ts`

**Caso 3:** Cliente necesita campo custom en booking (ej. "motivo_reserva")
- ❌ NO `ALTER TABLE bookings ADD COLUMN`
- ✅ SÍ usar `metadata` JSONB: `{ "custom": { "motivo": "..." } }`
- ✅ SÍ documentar schema de metadata en `CUSTOMIZATION.md`

**Validación:** Audit de `git diff` muestra 0 cambios en `src/modules/booking/`.

---

### ✅ Seed + Config Suficientes para Boot

**Test:**
1. Proyecto recién scaffoldeado
2. Solo ejecutar:
   ```bash
   npx supabase db push
   npm run seed:config
   npm run dev
   ```
3. Sin editar código TS

**Resultado esperado:**
- ✅ ConfigService carga sin errores
- ✅ PolicyRegistry tiene 2+ policies activas
- ✅ Endpoint `/api/health` responde 200
- ✅ No se requiere compilar nada custom

**Criterio:** "Zero-code boot" válido para setup inicial.

---

### ✅ Auditoría Core vs Custom Trivial

**Comando propuesto:**
```bash
npm run audit:core
```

**Output:**
```
Core Files (DO NOT MODIFY):
  ✅ src/modules/booking/domain/           (unchanged)
  ✅ src/modules/booking/application/      (unchanged)
  ⚠️  src/modules/booking/infrastructure/  (1 file modified - CHECK!)

Custom Files:
  📝 src/modules/custom/policies/          (3 files)
  📝 src/modules/custom/adapters/          (1 file)

Summary:
  Core: 0 violations
  Custom: 4 additions (valid)
```

**Validación:** En code review, cualquiera puede verificar límites.

---

### ✅ Sistema Sigue Siendo Configurable, No Hardcodeado

**Anti-patterns prohibidos:**

❌ **Hardcodear lógica de negocio en código:**
```typescript
// MAL
if (clientId === 'abc-123') {
  minLeadTime = 120; // Cliente ABC necesita 2h
}
```

✅ **Configurar vía JSON:**
```json
{
  "policies": {
    "LeadTimePolicy": { "minMinutes": 120 }
  }
}
```

---

❌ **Feature toggles con `if` manual:**
```typescript
// MAL
const enableVIP = process.env.CLIENT_NAME === 'VIP Corp';
```

✅ **Feature flags formales:**
```json
{
  "featureFlags": {
    "custom.policies.vip_enabled": true
  }
}
```

**Validación:** Lint rule custom: "No `process.env` en `src/modules/`" (excepto `shared/config/`).

---

## 9. Criterios de Éxito del Módulo 4

### Técnicos

1. **No Existe Razón para Forkear el Core**
   - Validación: 10 proyectos cliente comparten mismo `src/modules/booking/`
   - Diferencias entre proyectos solo en `custom/`, `seeds/`, `api/`

2. **Template Guía y Previene Errores**
   - Estructura opinionated reduce fricción
   - Documentación responde a "¿Puedo hacer X?" antes de que se pregunte
   - Scripts automatizan tareas error-prone

3. **Auditoría Trivial**
   - `git log src/modules/booking/` → commits solo vienen de template updates
   - `git log src/modules/custom/` → commits del cliente
   - Separación clara en historial

4. **Diff-Friendly**
   - Merge de template updates sin conflictos en 90% de casos
   - Conflictos típicos en 1-2 archivos predecibles (`PolicyRegistry`)

---

### De Negocio

1. **Time-to-Market: < 1 día**
   - Setup técnico: 30 min
   - Config inicial: 2h (seeds, resources)
   - Deploy staging + smoke tests: 4h
   - **Total:** mismo día operativo

2. **Mantenibilidad**
   - Bugfix en core → aplicable a N proyectos con 1 merge
   - Feature nueva opt-in → proyectos viejos no se rompen

3. **Onboarding**
   - Developer nuevo en proyecto cliente: lee `CUSTOMIZATION.md` → productivo en < 1 día
   - Junior puede agregar policy custom sin romper nada siguiendo guía

---

## 10. Próximos Pasos (Fuera de Scope M4 Diseño)

### Implementación de Scripts
- `scripts/bootstrap.sh`
- `scripts/migrate-template.sh`
- `scripts/audit-core.sh`

### Generación de Docs Template
- Templates de `CUSTOMIZATION.md` con todos los casos de uso
- `ARCHITECTURE.md` con diagramas Mermaid

### CI/CD Template
- GitHub Actions workflow para:
  - Lint
  - Tests
  - Build
  - Deploy staging automático
  - Deploy prod con aprobación manual

### Monitoreo Template
- Healthcheck endpoint robusto
- Logging structured (JSON)
- Error tracking (Sentry integration opcional)

---

## 11. Resumen Ejecutivo

**Módulo 4 transforma BellBooking de "código compartido" a "producto replicable".**

### Antes (Sin M4)
- Cada cliente = fork manual del repo
- Customizaciones mezcladas con core
- Actualizaciones imposibles sin conflictos
- Onboarding: semanas

### Después (Con M4)
- Cada cliente = instancia limpia del template
- Core intocable, custom aislado
- Actualizaciones vía merge controlado
- Onboarding: < 1 día

### Componentes Clave
1. **Estructura Opinionated:** Previene caos
2. **Boundary Core/Custom:** Garantiza mantenibilidad
3. **Scaffolding Automatizado:** Reduce errores humanos
4. **Docs Obligatorias:** Conocimiento perdurable
5. **Versionado Semántico:** Evolución predecible

### Garantías Arquitectónicas
- ✅ Core nunca se forkea
- ✅ Customización sin romper core
- ✅ Configuración > Código
- ✅ Diff-friendly para updates
- ✅ Auditable (git log separa core/custom)

**Resultado:** BellBooking es un **producto**, no un "proyecto base para copiar".
