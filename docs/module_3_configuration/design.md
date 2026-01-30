# Diseño Módulo 3: Configuración Dinámica & Seed

**Estado:** Diseño Propuesto  
**Fecha:** 2026-01-29  
**Dependencias:** Módulo 2 (Extensibilidad) - Consumer Principal.

## 1. Visión Arquitectónica

El Módulo 3 transforma _BellBooking_ de un motor estático a un sistema dinámico. Su responsabilidad es **inyectar el comportamiento** en el Módulo 2 mediante datos validados, sin tocar código.

### Responsabilidades
1.  **Centralización:** Fuente única de verdad para configuración (Policies, Flags, Business Rules).
2.  **Validación:** Garantizar que la configuración cargada es semánticamente correcta antes de arrancar.
3.  **Inyección:** Proveer valores al `PolicyRegistry` (M2) y `FeatureFlagProvider` (M2).
4.  **Bootstrapping:** Inicializar un entorno nuevo (Seed) con una configuración base funcional.

### Límites Claros
*   **Módulo 1:** NO ve ni conoce la configuración. Sigue siendo agnóstico.
*   **Módulo 2:** NO lee la DB de configuración. Recibe valores inyectados en sus constructores o fábricas.
*   **Módulo 3:** Es el "Cargador" y "Validador".

---

## 2. Modelo Conceptual de Configuración

La configuración se modela como un documento JSON jerárquico y tipeado.

### Estructura del `BookingConfig` (Root)

| Sección | Descripción | Responsabilidad |
| :--- | :--- | :--- |
| **`featureFlags`** | Mapa `key: boolean` | Overrides de flags definidos en M2. Controla qué policies se activan. |
| **`policies`** | Mapa `policyName: params` | Parámetros específicos para cada regla (ej. `minLeadTime`). |
| **`schedule`** | Objeto complejo | Definición de horarios operativos estándar y excepciones (holidays). |
| **`resources`** | Lista de definiciones | Metadata y categorización de recursos (sin ser una tabla relacional). |
| **`business`** | Metadata global | Info del negocio (nombre, timezone, currency conceptual). |

### Ejemplo Abstracto (JSON Schema Concept)
```json
{
  "version": "1.0",
  "business": { "timezone": "UTC" },
  "featureFlags": {
    "booking.policies.lead_time.enabled": true
  },
  "policies": {
    "LeadTimePolicy": { "minMinutes": 60 },
    "MaxAdvanceBookingPolicy": { "maxDays": 30 },
    "CancellationPolicy": { 
      "penaltyThresholdHours": 24,
      "allowSelfCancel": true 
    }
  },
  "schedule": {
    "default": { "mon_fri": ["09:00-18:00"] }
  }
}
```

---

## 3. Estrategia de Configuración de Policies

El Módulo 2 tiene policies puras. El Módulo 3 actúa como un **Adapter**.

1.  **Storage:** JSONB en DB (`app_config` table) o Archivo.
2.  **Loading:** `ConfigService` carga el JSON global.
3.  **Mapping:** `PolicyRegistry` (mejorado en M3) usa `ConfigService` para:
    *   Leer `featureFlags` -> Decidir si instancia `LeadTimePolicy`.
    *   Leer `policies.LeadTimePolicy` -> Obtener `{ minMinutes: 60 }`.
    *   Instanciar `new LeadTimePolicy(60)`.

**Beneficio:** La Policy no sabe de dónde salió el 60. El ConfigService no sabe qué hace la policy.

---

## 4. Almacenamiento y Ciclo de Vida

### Estrategia Híbrida (Archivo + DB)

1.  **Archivo (`system.config.json`):** Configuración base e inmutable por despliegue. Controlada por Git. Ideal para CI/CD y valores por defecto seguros.
2.  **Base de Datos (`app_config` table):** Configuración dinámica "en caliente". Permite al Admin cambiar reglas sin deploy.
    *   Clave: `is_active`, `environment`, `config_json`.
    *   Columna `JSONB` para flexibilidad total.

### Estrategia de Resolución (Runtime)
Orden de precedencia (Highest wins):
1.  Variables de Entorno (Solo para flags de emergencia o infra).
2.  DB Config (Dinámico).
3.  Archivo Config (Base/Seed).
4.  Defaults Harcodeados (Safety net en código).

### Cache
*   **On Boot:** Se carga la configuración completa en memoria (Singleton `ConfigData`).
*   **Refresh:** Webhook o puntero de versión para recargar sin reiniciar el proceso Node.js.

---

## 5. Seed y Bootstrapping

El Seed no es solo "datos de prueba", es la **Definición del Negocio**.

### Mecanismo
Un script idempotente `npm run seed:config` que:
1.  Lee `seeds/base-config.json`.
2.  Valida contra `ConfigSchema` (Zod).
3.  Upsert en tabla `app_config` con key `DEFAULT`.

### Versionado
*   Cada cambio en la estructura de config requiere subir `configVersion` en el JSON.
*   El código debe saber manejar versiones viejas (backward compatibility) o fallar al inicio (fail-fast) si la versión es incompatible.

---

## 6. Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
| :--- | :--- | :--- |
| **Config Inválida** | App crashea o comportamiento errático. | **Schema Validation (Zod)** estricto al arrancar. Si falla validación, la app NO inicia. |
| **Drift** | Prod tiene una config manual distinta a Git. | La UI de Admin debe advertir "Config Override active". El seed siempre es la verdad base. |
| **Parameter Type Mismatch** | Policy espera number, recibe string. | Validation Layer antes de inyectar en constructor. |

---

## 7. Checklist de Validación M3

- [ ] Se puede cambiar el `minLeadTime` de 60 a 120 minutos editando un JSON y reiniciando (o recargando), sin tocar TS.
- [ ] Si configuro `minMinutes: -5` (inválido), el sistema de validación lo detecta y rechaza la carga.
- [ ] Si borro la config de DB, el sistema levanta con los defaults del archivo o código (Safe Fallback).
- [ ] No hay consultas a DB dentro de `LeadTimePolicy.evaluate()`.
- [ ] El `PolicyRegistry` lee de `ConfigService`, no hardcodea valores.
