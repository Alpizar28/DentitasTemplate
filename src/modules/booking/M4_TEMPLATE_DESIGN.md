# Módulo 4: Template Repository & Scaffolding Strategy

> **Status:** DRAFT
> **Scope:** Repository Structure, Developer Experience (DX), CI/CD Readiness

Este documento define la estructura oficial del `BellBooking Template` y el proceso para instanciar nuevos proyectos de negocio (ej. "ClinicaDentalApp") a partir de este núcleo.

---

## 1. Filosofía del Template
*   **Separation of Concerns:** El núcleo de reservas (`src/modules/booking`) debe tratarse como una "librería interna". El código de negocio específico vive en `src/app` y `src/modules/{custom_module}`.
*   **Ready-to-Run:** El template debe incluir todo lo necesario para arrancar (Docker, Supabase Migrations, Seeds, UI Playground).
*   **Opinionated but Flexible:** Impone arquitectura Hexagonal en el Core, pero permite libertad en la capa de UI (Next.js App Router).

---

## 2. Estructura Canónica de Carrepertas

```text
/
├── .github/                # CI/CD Workflows (Tests, Lint)
├── .vscode/                # Recommended Extensions & Settings
├── seeds/                  # Configuración Base (base-config.json)
├── src/
│   ├── app/                # Next.js App Router (UI Implementation)
│   │   ├── (public)/       # Landing Pages
│   │   ├── (auth)/         # Login/Register
│   │   ├── dashboard/      # Admin/User Dashboard
│   │   └── playground/     # Reference Implementation (Keep for devs)
│   │   └── actions.ts      # Server Actions (Facade to Core)
│   │
│   ├── modules/
│   │   ├── booking/        # 🔒 CORE BOOKING SYSTEM (M1-M3)
│   │   │   ├── application # Use Cases, Services, Policies
│   │   │   ├── domain      # Entities, Value Objects, Errors
│   │   │   ├── infrastructure # Repositories, DB Adapters
│   │   │   └── tests       # Core Integration Tests
│   │   │
│   │   └── {custom}/       # Business Specific Modules (e.g. "patients", "payments")
│   │
│   └── shared/             # Shared Utilities (Supabase Client, Logger)
│
├── supabase/
│   ├── migrations/         # DDL SQL Scripts (Versioning)
│   └── config.toml         # Local Dev Config
│
├── .env.example            # Template Environment Variables
├── middleware.ts           # Auth Protection
└── package.json            # Scripts standardization
```

---

## 3. Estrategia de Scaffolding (Cómo usar el Template)

### Paso 1: Clonar y Desconectar ("Detach")
El objetivo es iniciar un nuevo historial git para el cliente final.

```bash
# 1. Clonar Template
git clone https://github.com/JokemTech/bellbooking-template new-project
cd new-project

# 2. Renombrar e Inicializar
# (Script futuro: npm run scaffold:init)
rm -rf .git
git init
```

### Paso 2: Configuración Inicial
1.  Copiar `.env.example` a `.env.development`.
2.  Levantar Supabase Local (`supabase start`).
3.  Aplicar migraciones (`npm run db:push` o `supabase db push`).
4.  Sembrar configuración basica (`npm run seed:config:dev`).

### Paso 3: Customización
1.  Editar `seeds/base-config.json` con las reglas de negocio del cliente (Timezone, Shifts, Policies).
2.  Ejecutar seed.
3.  Personalizar UI en `src/app` (Themes, Rutas).

---

## 4. Tareas del Módulo 4 (Roadmap)
1.  **Limpieza:** Asegurar que `src/app` no tenga "basura" temporal, solo el Playground funcional y una Home limpia.
2.  **Scripts:** Crear scripts npm útiles (`npm run project:setup`).
3.  **Documentation:** `README.md` raiz robusto explicando M1, M2, M3.
4.  **CI:** Setup básico de GitHub Actions para correr `vitest` en cada PR.
